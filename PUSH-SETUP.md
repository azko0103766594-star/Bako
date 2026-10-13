# Align – PWA + Notifications push

## Logo
Icônes dans `/icons/` :
- `icon-192.png` / `icon-512.png` (Android + PWA)
- `apple-touch-icon.png` (iPhone)

Couleur : violet Align `#7C5CFC` + lettre **A** blanche.

## 1. Générer les clés VAPID (une seule fois)

Sur ton PC ou Render shell :

```bash
npx web-push generate-vapid-keys
```

Tu obtiens `Public Key` et `Private Key`.

## 2. Variables d’environnement Render

| Variable | Valeur |
|----------|--------|
| `VAPID_PUBLIC_KEY` | la clé publique |
| `VAPID_PRIVATE_KEY` | la clé privée |
| `VAPID_SUBJECT` | `mailto:ton@email.com` (optionnel) |

## 3. Base de données

Exécute dans Postgres Render le contenu ajouté dans `schema.sql` :

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT)
);
CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
```

## 4. Déploiement

- Frontend (Vercel) : tout le dossier (dont `sw.js`, `manifest.webmanifest`, `icons/`, `notifications.js`)
- Backend (Render) : `npm install` (installe `web-push`) puis redémarre

## 5. Sur le téléphone

### Android (Chrome)
1. Ouvre le site
2. Menu → **Installer l’application** (ou bouton dans Paramètres Align)
3. Paramètres Align → **Activer les notifications** → Autoriser

### iPhone (Safari)
1. Ouvre le site dans **Safari** (pas Chrome)
2. Bouton **Partager** → **Sur l’écran d’accueil**
3. Ouvre Align depuis l’icône
4. Paramètres → **Activer les notifications** → Autoriser

## Limite importante

- Téléphone **complètement éteint** : aucune app (même WhatsApp) n’affiche de notif tant qu’il est off. Les push sont **mises en file** et arrivent dès que le téléphone se rallume / a du réseau.
- Plan **gratuit Render** : si le serveur dort, les push ne partent pas. Un petit plan “always on” ou un ping cron améliore la fiabilité.

## Test rapide

1. Deux comptes (Android + autre)
2. Active les notifs sur les deux
3. Ferme l’app (ou verrouille l’écran) sur A
4. Envoie un message depuis B
5. A doit recevoir la notification système
