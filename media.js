/* media.js – Compression image/video + enregistrement vocal */

// ========== MEDIA (image / video / voice) ==========
const MAX_VOICE_SEC = 30;
const MAX_VIDEO_SEC = 30;
const MAX_IMAGE_BYTES = 400 * 1024;   // ~400 KB after compress
const MAX_VIDEO_BYTES = 5 * 1024 * 1024; // 5 MB max
const MAX_AUDIO_BYTES = 800 * 1024;

let mediaRecorder = null;
let recordChunks = [];
let recordStart = 0;
let recordTimer = null;
let recordTarget = null; // 'space' | 'private'

function compressImage(file, maxBytes, maxW) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        URL.revokeObjectURL(url);
        let w = img.width || 800, h = img.height || 600;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > 1200) { w = Math.round(w * 1200 / h); h = 1200; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.8;
        const tryEncode = () => {
          try {
            // toDataURL plus compatible que toBlob sur certains Android
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            // estimation taille : longueur base64 ≈ taille
            const approxBytes = Math.round((dataUrl.length - 22) * 0.75);
            if (approxBytes <= maxBytes || quality <= 0.35) {
              resolve(dataUrl);
            } else {
              quality -= 0.15;
              tryEncode();
            }
          } catch (encErr) {
            reject(encErr);
          }
        };
        tryEncode();
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('img load')); };
    img.src = url;
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      let result = r.result;
      // Forcer un mime vidéo correct si absent (Samsung parfois vide)
      if (typeof result === 'string' && result.startsWith('data:application/octet-stream')) {
        const isVideo = (file.type && file.type.startsWith('video/')) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || '');
        if (isVideo) {
          result = result.replace('data:application/octet-stream', 'data:video/mp4');
        }
      }
      if (typeof result === 'string' && result.startsWith('data:;')) {
        result = result.replace('data:;', 'data:video/mp4;');
      }
      resolve(result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(v.src);
      resolve(d);
    };
    v.onerror = () => reject(new Error('video'));
    v.src = URL.createObjectURL(file);
  });
}

/** Découpe auto les 30 premières secondes + compresse (MediaRecorder) */
function trimAndCompressVideo(file, maxSec) {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.preload = 'auto';
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      try { video.pause(); } catch (e) {}
      URL.revokeObjectURL(url);
    };

    video.onerror = () => { cleanup(); reject(new Error('load')); };

    video.onloadedmetadata = async () => {
      try {
        const total = isFinite(video.duration) ? video.duration : maxSec;
        const duration = Math.min(total, maxSec);
        video.currentTime = 0;

        // Attendre que currentTime soit prêt
        await new Promise(r => {
          if (video.readyState >= 2) return r();
          video.oncanplay = r;
        });

        let stream = null;
        try {
          await video.play();
          if (typeof video.captureStream === 'function') stream = video.captureStream();
          else if (typeof video.mozCaptureStream === 'function') stream = video.mozCaptureStream();
        } catch (e) {
          // play peut être bloqué → fallback sans re-encode
        }

        // Fallback : si pas de captureStream ou fichier déjà court et léger
        if (!stream || typeof MediaRecorder === 'undefined') {
          cleanup();
          if (file.size <= MAX_VIDEO_BYTES && duration <= maxSec + 0.5) {
            const dataUrl = await fileToDataURL(file);
            return resolve({ dataUrl, duration, size: file.size });
          }
          return reject(new Error('nocapture'));
        }

        const mimeCandidates = [
          'video/webm;codecs=vp8,opus',
          'video/webm;codecs=vp9,opus',
          'video/webm',
          'video/mp4'
        ];
        let mime = '';
        for (const m of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
        }
        if (!mime) mime = 'video/webm';

        const chunks = [];
        let rec;
        try {
          rec = new MediaRecorder(stream, {
            mimeType: mime,
            videoBitsPerSecond: 500000, // ~0.5 Mbps = compression
            audioBitsPerSecond: 64000
          });
        } catch (e) {
          rec = new MediaRecorder(stream);
        }

        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onerror = () => { cleanup(); reject(new Error('rec')); };
        rec.onstop = () => {
          try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
          cleanup();
          const blob = new Blob(chunks, { type: mime });
          if (!blob.size) return reject(new Error('empty'));
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result, duration, size: blob.size });
          reader.onerror = () => reject(new Error('read'));
          reader.readAsDataURL(blob);
        };

        rec.start(250);
        // Arrêt automatique à maxSec (ou fin de vidéo)
        const stopAt = Math.ceil(duration * 1000) + 200;
        setTimeout(() => {
          if (rec.state === 'recording') rec.stop();
        }, stopAt);
      } catch (err) {
        cleanup();
        reject(err);
      }
    };
  });
}

async function handleMediaFile(e, target) {
  const files = e.target.files;
  // ne pas vider tout de suite sur iOS parfois
  if (!files || !files.length) return;

  if (files.length > 1) {
    toast('Envoie une seule image ou vidéo à la fois');
  }
  const file = files[0];
  e.target.value = '';

  // IMAGE
  if (file.type.startsWith('image/') || /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(file.name || '')) {
    try {
      toast('Envoi de l\'image...');
      let dataUrl = null;
      try {
        dataUrl = await compressImage(file, MAX_IMAGE_BYTES, 900);
      } catch (compErr) {
        console.warn('compress fail, fallback', compErr);
        // Fallback sans compression si < 1.5 Mo
        if (file.size <= 1.5 * 1024 * 1024) {
          dataUrl = await fileToDataURL(file);
        }
      }
      if (!dataUrl || typeof dataUrl !== 'string' || dataUrl.length < 50) {
        toast('Impossible de lire l\'image');
        return;
      }
      const ok = pushMediaMsg(target, 'image', dataUrl, '');
      if (ok) toast('Image envoyée');
    } catch (err) {
      console.error('image send', err);
      toast('Erreur image : ' + (err.message || 'inconnu'));
    }
    return;
  }

  // VIDEO
  if (file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name || '')) {
    try {
      toast('Traitement vidéo...');
      let dataUrl = null;
      let duration = 0;

      const dur = await getVideoDuration(file).catch(() => 0);
      duration = dur || 0;

      // Priorité 1 : vidéo déjà ≤30s et ≤5Mo → envoi direct (meilleure lecture Android/MP4)
      if (duration > 0 && duration <= MAX_VIDEO_SEC && file.size <= MAX_VIDEO_BYTES) {
        dataUrl = await fileToDataURL(file);
      } else if (duration > MAX_VIDEO_SEC || file.size > MAX_VIDEO_BYTES) {
        // Priorité 2 : découper / compresser les 30 premières secondes
        toast('Découpage 30s + compression...');
        try {
          const result = await trimAndCompressVideo(file, MAX_VIDEO_SEC);
          if (result && result.dataUrl && result.size > 1000) {
            dataUrl = result.dataUrl;
            duration = result.duration || MAX_VIDEO_SEC;
          }
        } catch (trimErr) {
          console.warn('trim fail', trimErr);
        }
        if (!dataUrl) {
          toast('Vidéo trop longue/lourde. Envoie une vidéo ≤30s et ≤5Mo.');
          return;
        }
      } else {
        // durée inconnue → essayer envoi direct si taille OK
        if (file.size > MAX_VIDEO_BYTES) {
          toast('Vidéo trop lourde (max 5 Mo)');
          return;
        }
        dataUrl = await fileToDataURL(file);
      }

      if (!dataUrl) {
        toast('Impossible de lire la vidéo');
        return;
      }
      if (dataUrl.length > 8 * 1024 * 1024) {
        toast('Vidéo trop lourde pour le stockage local');
        return;
      }

      const ok = pushMediaMsg(target, 'video', dataUrl, '', duration);
      if (ok) toast('Vidéo envoyée' + (duration ? ' (' + Math.round(duration) + 's)' : ''));
    } catch (err) {
      console.error('video send', err);
      toast('Erreur vidéo : ' + (err.message || 'inconnu'));
    }
    return;
  }

  toast('Format non supporté (image ou vidéo uniquement)');
}

function toggleRecord(target) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    stopRecord(target);
    return;
  }
  startRecord(target);
}

async function startRecord(target) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast('Micro non supporté');
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordChunks = [];
    recordTarget = target;
    mediaRecorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg' });
    mediaRecorder.ondataavailable = e => { if (e.data.size) recordChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(recordTimer);
      const bar = document.getElementById('record-bar-' + target);
      const mic = document.getElementById('btn-mic-' + target);
      if (bar) bar.style.display = 'none';
      if (mic) mic.classList.remove('recording');

      const blob = new Blob(recordChunks, { type: mediaRecorder.mimeType || 'audio/webm' });
      if (blob.size > MAX_AUDIO_BYTES) {
        toast('Vocal trop long / lourd');
        return;
      }
      const duration = (Date.now() - recordStart) / 1000;
      if (duration < 0.5) { toast('Trop court'); return; }
      const dataUrl = await fileToDataURL(blob);
      pushMediaMsg(target, 'audio', dataUrl, '', duration);
      toast('Vocal envoyé (' + Math.round(duration) + 's)');
    };
    mediaRecorder.start(200);
    recordStart = Date.now();
    const bar = document.getElementById('record-bar-' + target);
    const mic = document.getElementById('btn-mic-' + target);
    const timerEl = document.getElementById('rec-timer-' + target);
    if (bar) bar.style.display = 'flex';
    if (mic) mic.classList.add('recording');
    if (timerEl) timerEl.textContent = '0:00';
    recordTimer = setInterval(() => {
      const sec = Math.floor((Date.now() - recordStart) / 1000);
      if (timerEl) timerEl.textContent = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      if (sec >= MAX_VOICE_SEC) stopRecord(target);
    }, 250);
  } catch (err) {
    toast('Accès micro refusé');
  }
}

function stopRecord(target) {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
}

