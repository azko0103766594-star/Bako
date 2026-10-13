/* media.js – Compression forte image/vidéo/vocal + upload Cloudinary */

// ========== LIMITES (économie stockage) ==========
const MAX_VOICE_SEC = 30;
const MAX_VIDEO_SEC = 30;
const MAX_IMAGE_BYTES = 180 * 1024;   // ~180 KB après compress
const MAX_VIDEO_BYTES = 2.5 * 1024 * 1024; // 2.5 MB max
const MAX_AUDIO_BYTES = 400 * 1024;  // ~400 KB

let mediaRecorder = null;
let recordChunks = [];
let recordStart = 0;
let recordTimer = null;
let recordTarget = null; // 'space' | 'private'

// Config Cloudinary – remplir cloudName + uploadPreset (unsigned)
function getCloudinaryConfig() {
  const c = window.ALIGN_CLOUDINARY || {};
  return {
    cloudName: c.cloudName || window.CLOUDINARY_CLOUD_NAME || "",
    uploadPreset: c.uploadPreset || window.CLOUDINARY_UPLOAD_PRESET || "",
    folder: c.folder || "align"
  };
}

function dataUrlToBlob(dataUrl) {
  const parts = dataUrl.split(",");
  const mime = (parts[0].match(/:(.*?);/) || [])[1] || "application/octet-stream";
  const bin = atob(parts[1] || "");
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function blobToFile(blob, name) {
  return new File([blob], name, { type: blob.type || "application/octet-stream" });
}

/** Upload vers Cloudinary (unsigned) ou fallback API locale */
async function uploadMediaToCloud(fileOrBlob, filename) {
  const cfg = getCloudinaryConfig();
  const file = fileOrBlob instanceof File
    ? fileOrBlob
    : blobToFile(fileOrBlob, filename || "media.bin");

  if (cfg.cloudName && cfg.uploadPreset) {
    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", cfg.uploadPreset);
    if (cfg.folder) form.append("folder", cfg.folder);

    const res = await fetch(
      "https://api.cloudinary.com/v1_1/" + cfg.cloudName + "/auto/upload",
      { method: "POST", body: form }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error && data.error.message ? data.error.message : "Upload Cloudinary échoué");
    }
    let url = data.secure_url || data.url;
    if (url && data.resource_type === "image") {
      url = url.replace("/upload/", "/upload/q_auto:low,f_auto,w_900/");
    }
    return { url, publicId: data.public_id, bytes: data.bytes };
  }

  if (typeof uploadMediaApi === "function") {
    const data = await uploadMediaApi(file);
    return { url: data.url || data.key, publicId: data.key, bytes: file.size };
  }

  throw new Error("Cloudinary non configuré (window.ALIGN_CLOUDINARY)");
}

function compressImage(file, maxBytes, maxW) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        URL.revokeObjectURL(url);
        let w = img.width || 800, h = img.height || 600;
        if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
        if (h > 1000) { w = Math.round(w * 1000 / h); h = 1000; }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        let quality = 0.62;
        const tryEncode = () => {
          try {
            const dataUrl = canvas.toDataURL("image/jpeg", quality);
            const approxBytes = Math.round((dataUrl.length - 22) * 0.75);
            if (approxBytes <= maxBytes || quality <= 0.28) {
              resolve(dataUrl);
            } else {
              quality -= 0.12;
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
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("img load")); };
    img.src = url;
  });
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      let result = r.result;
      if (typeof result === "string" && result.startsWith("data:application/octet-stream")) {
        const isVideo = (file.type && file.type.startsWith("video/")) || /\.(mp4|mov|m4v|webm|3gp)$/i.test(file.name || "");
        if (isVideo) result = result.replace("data:application/octet-stream", "data:video/mp4");
      }
      if (typeof result === "string" && result.startsWith("data:;")) {
        result = result.replace("data:;", "data:video/mp4;");
      }
      resolve(result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function getVideoDuration(file) {
  return new Promise((resolve, reject) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      const d = v.duration;
      URL.revokeObjectURL(v.src);
      resolve(d);
    };
    v.onerror = () => reject(new Error("video"));
    v.src = URL.createObjectURL(file);
  });
}

function trimAndCompressVideo(file, maxSec) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";
    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      try { video.pause(); } catch (e) {}
      URL.revokeObjectURL(url);
    };

    video.onerror = () => { cleanup(); reject(new Error("load")); };

    video.onloadedmetadata = async () => {
      try {
        const total = isFinite(video.duration) ? video.duration : maxSec;
        const duration = Math.min(total, maxSec);
        video.currentTime = 0;

        await new Promise(r => {
          if (video.readyState >= 2) return r();
          video.oncanplay = r;
        });

        let stream = null;
        try {
          await video.play();
          if (typeof video.captureStream === "function") stream = video.captureStream();
          else if (typeof video.mozCaptureStream === "function") stream = video.mozCaptureStream();
        } catch (e) {}

        if (!stream || typeof MediaRecorder === "undefined") {
          cleanup();
          if (file.size <= MAX_VIDEO_BYTES && duration <= maxSec + 0.5) {
            const dataUrl = await fileToDataURL(file);
            return resolve({ dataUrl, duration, size: file.size });
          }
          return reject(new Error("nocapture"));
        }

        const mimeCandidates = [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4"
        ];
        let mime = "";
        for (const m of mimeCandidates) {
          if (MediaRecorder.isTypeSupported(m)) { mime = m; break; }
        }
        if (!mime) mime = "video/webm";

        const chunks = [];
        let rec;
        try {
          rec = new MediaRecorder(stream, {
            mimeType: mime,
            videoBitsPerSecond: 350000,
            audioBitsPerSecond: 48000
          });
        } catch (e) {
          rec = new MediaRecorder(stream);
        }

        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onerror = () => { cleanup(); reject(new Error("rec")); };
        rec.onstop = () => {
          try { stream.getTracks().forEach(t => t.stop()); } catch (e) {}
          cleanup();
          const blob = new Blob(chunks, { type: mime });
          if (!blob.size) return reject(new Error("empty"));
          const reader = new FileReader();
          reader.onload = () => resolve({ dataUrl: reader.result, duration, size: blob.size });
          reader.onerror = () => reject(new Error("read"));
          reader.readAsDataURL(blob);
        };

        rec.start(250);
        const stopAt = Math.ceil(duration * 1000) + 200;
        setTimeout(() => {
          if (rec.state === "recording") rec.stop();
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
  if (!files || !files.length) return;

  if (files.length > 1) toast("Envoie une seule image ou vidéo à la fois");
  const file = files[0];
  e.target.value = "";

  if (file.type.startsWith("image/") || /\.(jpe?g|png|gif|webp|heic|bmp)$/i.test(file.name || "")) {
    try {
      toast("Compression image…");
      let dataUrl = null;
      try {
        dataUrl = await compressImage(file, MAX_IMAGE_BYTES, 720);
      } catch (compErr) {
        console.warn("compress fail", compErr);
        if (file.size <= 800 * 1024) dataUrl = await fileToDataURL(file);
      }
      if (!dataUrl || dataUrl.length < 50) {
        toast("Impossible de lire l'image");
        return;
      }
      toast("Upload image…");
      const blob = dataUrlToBlob(dataUrl);
      const up = await uploadMediaToCloud(blob, "img_" + Date.now() + ".jpg");
      if (pushMediaMsg(target, "image", up.url, "")) toast("Image envoyée");
    } catch (err) {
      console.error("image send", err);
      toast("Erreur image : " + (err.message || "inconnu"));
    }
    return;
  }

  if (file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|3gp)$/i.test(file.name || "")) {
    try {
      toast("Traitement vidéo…");
      let duration = 0;
      let uploadBlob = null;

      const dur = await getVideoDuration(file).catch(() => 0);
      duration = dur || 0;

      if (duration > 0 && duration <= MAX_VIDEO_SEC && file.size <= MAX_VIDEO_BYTES) {
        uploadBlob = file;
      } else if (duration > MAX_VIDEO_SEC || file.size > MAX_VIDEO_BYTES) {
        toast("Découpage 30s + compression…");
        try {
          const result = await trimAndCompressVideo(file, MAX_VIDEO_SEC);
          if (result && result.dataUrl && result.size > 1000) {
            duration = result.duration || MAX_VIDEO_SEC;
            uploadBlob = dataUrlToBlob(result.dataUrl);
          }
        } catch (trimErr) {
          console.warn("trim fail", trimErr);
        }
        if (!uploadBlob) {
          toast("Vidéo trop longue/lourde. Max 30s et ~2,5 Mo.");
          return;
        }
      } else {
        if (file.size > MAX_VIDEO_BYTES) {
          toast("Vidéo trop lourde (max 2,5 Mo)");
          return;
        }
        uploadBlob = file;
      }

      toast("Upload vidéo…");
      const up = await uploadMediaToCloud(uploadBlob, "vid_" + Date.now() + ".mp4");
      if (pushMediaMsg(target, "video", up.url, "", duration)) {
        toast("Vidéo envoyée" + (duration ? " (" + Math.round(duration) + "s)" : ""));
      }
    } catch (err) {
      console.error("video send", err);
      toast("Erreur vidéo : " + (err.message || "inconnu"));
    }
    return;
  }

  toast("Format non supporté (image ou vidéo uniquement)");
}

function toggleRecord(target) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    stopRecord(target);
    return;
  }
  startRecord(target);
}

async function startRecord(target) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    toast("Micro non supporté");
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
    });
    recordChunks = [];
    recordTarget = target;

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : (MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg");

    try {
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime, audioBitsPerSecond: 24000 });
    } catch (e) {
      mediaRecorder = new MediaRecorder(stream, { mimeType: mime });
    }

    mediaRecorder.ondataavailable = e => { if (e.data.size) recordChunks.push(e.data); };
    mediaRecorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(recordTimer);
      const bar = document.getElementById("record-bar-" + target);
      const mic = document.getElementById("btn-mic-" + target);
      if (bar) bar.style.display = "none";
      if (mic) mic.classList.remove("recording");

      const blob = new Blob(recordChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const duration = (Date.now() - recordStart) / 1000;
      if (duration < 0.5) { toast("Trop court"); return; }
      if (blob.size > MAX_AUDIO_BYTES) {
        toast("Vocal trop lourd (max ~400 Ko)");
        return;
      }

      try {
        toast("Upload vocal…");
        const up = await uploadMediaToCloud(blob, "voc_" + Date.now() + ".webm");
        pushMediaMsg(target, "audio", up.url, "", duration);
        toast("Vocal envoyé (" + Math.round(duration) + "s)");
      } catch (err) {
        console.error(err);
        toast("Erreur vocal : " + (err.message || "upload"));
      }
    };
    mediaRecorder.start(200);
    recordStart = Date.now();
    const bar = document.getElementById("record-bar-" + target);
    const mic = document.getElementById("btn-mic-" + target);
    const timerEl = document.getElementById("rec-timer-" + target);
    if (bar) bar.style.display = "flex";
    if (mic) mic.classList.add("recording");
    if (timerEl) timerEl.textContent = "0:00";
    recordTimer = setInterval(() => {
      const sec = Math.floor((Date.now() - recordStart) / 1000);
      if (timerEl) timerEl.textContent = Math.floor(sec / 60) + ":" + String(sec % 60).padStart(2, "0");
      if (sec >= MAX_VOICE_SEC) stopRecord(target);
    }, 250);
  } catch (err) {
    toast("Accès micro refusé");
  }
}

function stopRecord(target) {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
}
