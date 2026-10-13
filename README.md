# Align – Version Tout-en-un (Render)

Frontend + Backend ensemble sur **un seul** service Render.

## Structure

```
backend/                    ← tout est dedans
├── package.json
├── .env.example
├── schema.sql
├── src/
│   └── index.js            ← API + sert le frontend
├── public/                 ← le frontend
│   ├── index.html
│   ├── styles.css
│   └── js/
└── uploads/                ← images/vidéos uploadées
```

---

## Déploiement sur Render (tout-en-un)

### 1. Base de données
1. Sur Render → **New** → **PostgreSQL**
2. Crée une base (ex: `align-db`)
3. Exécute le contenu de `schema.sql` dans cette base

### 2. Web Service
1. **New** → **Web Service**
2. Connecte ton repo GitHub (mets **tout le contenu du dossier `backend/`** dans le repo)
3. Configuration :
   - **Build Command** : `npm install`
   - **Start Command** : `npm start`
4. Variables d’environnement :

| Variable               | Valeur                                      |
|------------------------|---------------------------------------------|
| `DATABASE_URL`         | (URL de ta base Postgres Render)            |
| `GOOGLE_CLIENT_ID`     | ton Client ID Google                        |
| `GOOGLE_CLIENT_SECRET` | ton Client Secret Google                    |
| `FRONTEND_URL`         | https://ton-service.onrender.com            |
| `API_URL`              | https://ton-service.onrender.com            |
| `NODE_ENV`             | production                                  |

5. **Deploy**

### 3. Google OAuth
Dans la Google Console, mets comme **Authorized redirect URI** :
```
https://ton-service.onrender.com/api/auth/callback
```

---

## C’est tout

Une fois déployé, ton app sera accessible sur :
```
https://ton-service.onrender.com
```

Le même service sert :
- Le frontend (pages)
- L’API (`/api/...`)
- Les fichiers uploadés (`/uploads/...`)

---

## Note sur les médias
Sur le plan gratuit, les fichiers uploadés peuvent disparaître au redéploiement.
Pour la production, on pourra ajouter Cloudinary plus tard.
