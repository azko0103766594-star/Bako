# Align – Prototype Frontend

Application de messagerie intelligente pour organiser groupes et plans sans le bordel.

## Déploiement sur Netlify

1. Va sur [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Glisse-dépose le dossier (ou le zip décompressé)
3. Ton site est en ligne en quelques secondes

Ou via la CLI :
```bash
npm install -g netlify-cli
netlify deploy --dir=. --prod
```

## Fonctionnalités du prototype

- Connexion simulée avec Gmail
- Création de profil (photo, prénom, username)
- Création d’espaces (lien + code à 6 chiffres)
- Rejoindre un espace via code
- Discussion avec sujets (threads)
- Plans : lancer des décisions + votes
- Onglets Médias & Infos
- Données persistées en localStorage (navigateur)

## Stack

- HTML / CSS / JavaScript pur (aucune dépendance)
- Prêt pour Netlify (site statique)

## Note

Ceci est un **prototype frontend**.  
L’authentification Google réelle, le backend, les notifications push et le mode proximité nécessiteront un serveur plus tard.
