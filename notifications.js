/* notifications.js – PWA + Web Push + notifs locales */
(function () {
  let VAPID_PUBLIC =
    (window.ALIGN_VAPID_PUBLIC_KEY || window.VAPID_PUBLIC_KEY || '').trim();

  async function loadVapidPublic() {
    if (VAPID_PUBLIC) return VAPID_PUBLIC;
    try {
      const base = (typeof API_BASE !== 'undefined' && API_BASE) ? API_BASE : (window.ALIGN_API_URL || 'https://aligne2.onrender.com');
      const res = await fetch(base + '/api/push/vapid-public');
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
    if (!('Notification' in window)) {
      if (typeof toast === 'function') toast('Ce navigateur ne gère pas les notifications');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') {
      // Le navigateur bloque : l'utilisateur doit réactiver manuellement
      if (typeof toast === 'function') {
        toast('Notifs bloquées. Chrome : ⋮ → Infos du site → Notifications → Autoriser');
      }
      return false;
    }
    const r = await Notification.requestPermission();
    return r === 'granted';
  }

  function apiBase() {
    if (typeof API_BASE !== 'undefined' && API_BASE) return API_BASE;
    if (window.ALIGN_API_URL) return window.ALIGN_API_URL;
    return 'https://aligne2.onrender.com';
  }

  async function subscribePush(reg) {
    await loadVapidPublic();
    if (!reg || !VAPID_PUBLIC) {
      console.warn('Push: pas de clé VAPID publique');
      if (typeof toast === 'function') toast('Clé VAPID manquante sur le serveur');
      return null;
    }
    if (!reg.pushManager) return null;
    try {
      // Res’abonner proprement (évite un ancien abonnement invalide)
      let sub = await reg.pushManager.getSubscription();
      if (sub) {
        try { await sub.unsubscribe(); } catch (e) {}
      }
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC)
      });

      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('align_token');
      if (!token) {
        if (typeof toast === 'function') toast('Connecte-toi avant d’activer les notifs');
        return null;
      }

      const res = await fetch(apiBase() + '/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        },
        body: JSON.stringify(sub.toJSON())
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.warn('subscribe api', res.status, data);
        if (typeof toast === 'function') toast('Enregistrement notif échoué: ' + (data.error || res.status));
        return null;
      }
      console.log('[Align] push abonné OK');
      return sub;
    } catch (err) {
      console.warn('subscribePush', err);
      if (typeof toast === 'function') toast('Erreur abonnement: ' + (err.message || 'inconnu'));
      return null;
    }
  }

  /** Envoie une notif de test via le serveur */
  window.testAlignNotification = async function () {
    try {
      // Notif locale immédiate (prouve que le téléphone accepte)
      if (Notification.permission === 'granted') {
        window.showAlignNotification('Align', 'Test local – si tu vois ça, les notifs système marchent');
      }
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('align_token');
      if (!token) {
        if (typeof toast === 'function') toast('Connecte-toi d’abord');
        return;
      }
      // S’assurer d’être abonné
      await window.initAlignNotifications();
      const res = await fetch(apiBase() + '/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token
        }
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (typeof toast === 'function') toast('Test push échoué: ' + (data.error || res.status));
        return;
      }
      if (typeof toast === 'function') {
        toast(data.sent ? 'Push serveur envoyé – regarde tes notifs' : 'Aucun abonnement en base – réactive les notifs');
      }
    } catch (e) {
      if (typeof toast === 'function') toast('Erreur test: ' + (e.message || ''));
    }
  };

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

  /** À appeler après login ou bouton Paramètres */
  window.initAlignNotifications = async function () {
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      if (typeof toast === 'function') toast('HTTPS requis pour les notifications');
      return { permission: 'denied', subscribed: false };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      if (typeof toast === 'function') toast('Service Worker indisponible sur ce navigateur');
      return { permission: Notification.permission, subscribed: false };
    }

    const ok = await ensurePermission();
    if (!ok) {
      return { permission: Notification.permission, subscribed: false };
    }

    const sub = await subscribePush(reg);
    if (typeof toast === 'function') {
      if (sub) toast('✅ Notifications activées');
      else toast('Permission OK, mais abonnement push échoué (vérifie VAPID sur Render)');
    }
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

  // Toujours afficher le bouton installer (instructions si pas de prompt natif)
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btn-install-pwa');
    if (btn) btn.style.display = '';
  });

  window.installAlignPWA = async function () {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      deferredPrompt = null;
      if (typeof toast === 'function') {
        toast(outcome === 'accepted' ? 'Align installé !' : 'Installation annulée');
      }
      return outcome === 'accepted';
    }

    if (isIOS) {
      if (typeof toast === 'function') {
        toast('iPhone : Safari → bouton Partager (□↑) → « Sur l’écran d’accueil »');
      }
      alert(
        'Installer Align sur iPhone :\n\n' +
        '1. Ouvre ce site dans Safari\n' +
        '2. Appuie sur Partager (carré avec flèche)\n' +
        '3. Choisis « Sur l’écran d’accueil »\n' +
        '4. Valide\n\n' +
        'Ensuite ouvre Align depuis l’icône pour les notifications.'
      );
      return false;
    }

    if (isAndroid) {
      if (typeof toast === 'function') {
        toast('Chrome : menu ⋮ → « Installer l’application » ou « Ajouter à l’écran d’accueil »');
      }
      alert(
        'Installer Align sur Android :\n\n' +
        '1. Ouvre ce site dans Chrome\n' +
        '2. Menu ⋮ en haut à droite\n' +
        '3. « Installer l’application »\n' +
        '   (ou « Ajouter à l’écran d’accueil »)\n\n' +
        'Si tu ne vois pas l’option, recharge la page et réessaie.'
      );
      return false;
    }

    if (typeof toast === 'function') {
      toast('Utilise le menu du navigateur → Installer / Ajouter à l’écran d’accueil');
    }
    return false;
  };

  // Auto register SW au chargement (sans demander la permission tout de suite)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => registerServiceWorker());
  } else {
    registerServiceWorker();
  }
})();
