/* utils.js – Helpers UI et utilitaires */

function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function toast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function code() { return String(Math.floor(100000 + Math.random() * 900000)); }
function initial(n) { return n ? n.charAt(0).toUpperCase() : '?'; }

function defaultAvatar(name) {
  try {
    const c = document.createElement('canvas');
    c.width = 80; c.height = 80;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#4F46E5';
    ctx.fillRect(0, 0, 80, 80);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(initial(name), 40, 44);
    return c.toDataURL();
  } catch (e) { return ''; }
}

function getBaseUrl() { return window.location.origin; }

function formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
  }
  return d.getDate() + '/' + (d.getMonth() + 1);
}

/** dataURL → { url, mime } pour lecture Samsung/Chrome */
function dataUrlToObjectUrl(dataUrl) {
  try {
    if (!dataUrl || typeof dataUrl !== 'string') return { url: dataUrl || '', mime: 'video/mp4' };
    if (!dataUrl.startsWith('data:')) return { url: dataUrl, mime: 'video/mp4' };
    const comma = dataUrl.indexOf(',');
    if (comma < 0) return { url: dataUrl, mime: 'video/mp4' };
    const meta = dataUrl.slice(0, comma);
    const base64 = dataUrl.slice(comma + 1);
    const mimeMatch = meta.match(/data:([^;,]+)/);
    let mime = (mimeMatch && mimeMatch[1]) ? mimeMatch[1].trim() : 'video/mp4';
    if (mime === 'application/octet-stream' || mime === 'video') mime = 'video/mp4';
    if (mime.indexOf('webm') >= 0) mime = 'video/webm';
    if (mime.indexOf('mp4') >= 0 || mime.indexOf('m4v') >= 0 || mime.indexOf('quicktime') >= 0) mime = 'video/mp4';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: mime });
    return { url: URL.createObjectURL(blob), mime: mime };
  } catch (e) {
    console.error('dataUrlToObjectUrl', e);
    return { url: dataUrl, mime: 'video/mp4' };
  }
}
