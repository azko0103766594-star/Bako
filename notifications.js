/* notifications.js – PWA + Web Push + notifs locales */
(function () {
  let VAPID_PUBLIC =
    (window.ALIGN_VAPID_PUBLIC_KEY || window.VAPID_PUBLIC_KEY || '').trim();

  async function loadVapidPublic() {
    if (VAPID_PUBLIC) return VAPID_PUBLIC;
    try {
      const base = typeof API_BASE !== 'undefined' ? API_BASE : '';
      const res = await fetch((base || '') + '/api/push/vapid-public');
      const data = await res.json();
      if (data && data.publicKey) {
        VAPID_PUBLIC = data.publicKey;
        window.ALIGN_VAPID_PUBLIC_KEY = VAPID_PUBLIC;
      }
    } catch (e) {}
    return VAPID_PUBLIC;
  }

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
  }

  async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
      return reg;
    } catch (err) {
      console.warn('SW register', err);
      return null;
    }
  }

  async function ensurePermission() {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const r = await Notification.requestPermission();
    return r === 'granted';
  }

  async function subscribePush(reg) {
    await loadVapidPublic();
    if (!reg || !VAPID_PUBLIC) {
      console.warn('Push: pas de clé VAPID publique – configure VAPID sur Render');
      return null;
    }
    if (!reg.pushManager) return null;
    try {
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
        });
      }
      // Envoyer au serveur
      if (typeof api === 'function' || typeof window.api === 'function') {
        /* uses fetch below */
      }
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('align_token');
      const base = typeof API_BASE !== 'undefined' ? API_BASE : '';
      await fetch((base || '') + '/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {})
        },
        body: JSON.stringify(sub.toJSON())
      }).catch((e) => console.warn('subscribe api', e));
      return sub;
    } catch (err) {
      console.warn('subscribePush', err);
      return null;
    }
  }

  /** Notification locale (app ouverte ou onglet en fond) */
  window.showAlignNotification = function (title, body, url) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    // Si l'onglet est visible, on peut juste toast ; sinon notif système
    try {
      const n = new Notification(title || 'Align', {
        body: body || '',
        icon: '/icons/icon-192.png',
        tag: 'align-local',
        data: { url: url || '/' }
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
    } catch (e) {
      // Android parfois préfère le SW
      if (navigator.serviceWorker && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title || 'Align', {
            body: body || '',
            icon: '/icons/icon-192.png',
            tag: 'align-local'
          });
        });
      }
    }
  };

  /** À appeler après login */
  window.initAlignNotifications = async function () {
    const reg = await registerServiceWorker();
    const ok = await ensurePermission();
    if (!ok) {
      if (typeof toast === 'function') toast('Notifications refusées – tu peux les activer dans les paramètres');
      return { permission: Notification.permission, subscribed: false };
    }
    const sub = await subscribePush(reg);
    if (typeof toast === 'function' && sub) toast('Notifications activées');
    return { permission: 'granted', subscribed: !!sub };
  };

  /** Install PWA prompt */
  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.alignInstallPrompt = deferredPrompt;
    const btn = document.getElementById('btn-install-pwa');
    if (btn) btn.style.display = '';
  });

  window.installAlignPWA = async function () {
    if (!deferredPrompt) {
      if (typeof toast === 'function') {
        toast('Sur iPhone : Safari → Partager → Sur l’écran d’accueil');
      }
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    deferredPrompt = null;
    return outcome === 'accepted';
  };

  // Auto register SW au chargement (sans demander la permission tout de suite)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => registerServiceWorker());
  } else {
    registerServiceWorker();
  }
})();
