# Mon cadre — v4

Application de suivi personnelle : séances, poids, eau, calories, pas, tests, respiration, objectifs, alimentation.

Les calories des repas sont estimées à partir de la table Ciqual 2020 de l'ANSES (Licence Ouverte Etalab), incluse dans `ciqual.json`.
Fichiers statiques, sans dépendance, fonctionne hors ligne une fois ouverte.

## Essayer sur l'ordinateur
    cd ~/Downloads/mon_cadre_v4 && python3 -m http.server 8765
puis ouvrir http://127.0.0.1:8765

## Mettre en ligne gratuitement (GitHub Pages)
Un service worker exige une adresse en https : GitHub Pages la fournit gratuitement.
1. Créer un dépôt public, par exemple `mon-cadre`, et y envoyer le contenu de ce dossier.
2. Settings → Pages → Branch `main`, dossier `/ (root)`.
3. L'app est disponible à `https://<pseudo>.github.io/mon-cadre/`.

## Installer sur le téléphone
- iPhone : ouvrir l'adresse dans Safari → Partager → « Sur l'écran d'accueil ».
- Android : ouvrir dans Chrome → bouton « Installer » dans l'app, ou menu ⋮ → « Installer l'application ».

## Mettre à jour
Modifier les fichiers, puis changer `VERSION` dans `sw.js` (sinon le téléphone garde l'ancienne version), et republier.

## Données
Tout reste dans le téléphone. Moi → Mes données → « Sauvegarder mes données » crée un fichier JSON,
« Restaurer une sauvegarde » le relit (accepte aussi les sauvegardes de l'ancienne version).
