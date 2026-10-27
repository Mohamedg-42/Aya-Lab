# Plan — Laboratoire EPHD d’Ayamé

Le Blueprint métier a été confirmé : les modules, rôles et données de démonstration suivent le cahier des charges, avec une base MySQL gérée. Le projet utilise React, TypeScript, Express, Drizzle et MySQL. Les comptes ont des mots de passe scryptés, des sessions révocables stockées sous forme hachée, des contrôles de rôle lors de l’écriture de l’état partagé et un jeu initial normalisé. L’interface synchronise ses modifications dans une table de sauvegarde JSON partagée, en complément des tables métier initialisées.

## Architecture

- `client/src/pages/Home.tsx` : connexion, menus par rôle, modules métier, filtres, formulaires, transitions de bulletin, calcul des résultats, alertes réactif et impression.
- `client/src/index.css` : système visuel Inter, palette sobre, tableaux denses, composants responsive et mise en page à barre latérale.
- `shared/lab.ts` et `shared/lab-seed.ts` : types métier et données fictives déterministes.
- `server/lab-api.ts` : connexion et sessions du personnel, lecture/synchronisation de l’état, règles d’autorisation au niveau des champs/états selon les rôles.
- `server/seed.ts` : peuplement idempotent, hachage de comptes, insertion des données liées et initialisation de l’instantané.
- `drizzle/schema.ts` et `drizzle/` : schéma MySQL pour utilisateurs de laboratoire, sessions, patients, prescripteurs, techniciens, analyses, paramètres, produits, bulletins, résultats et liaisons.
- `client/public/manus-routes.json` : manifeste des routes de page.

## Conception

La direction est celle d’un outil clinique administratif sobre, plutôt que d’un site promotionnel. La priorité est la lisibilité opérationnelle, la densité sans surcharge, l’identification des anomalies et des interactions courtes. Les écrans utilisent une base blanche/gris clair, bleu profond comme couleur d’accent, le symbole de microscope AYALAB et des étiquettes métier discrètes. La barre latérale reste fixe sur grand écran ; tableaux, modales, recherches et formulaires s’adaptent aux écrans mobiles. Animations limitées à de brèves transitions d’ouverture. Inter donne une hiérarchie courte et les chiffres tabulaires servent les tickets, résultats et stocks. La voix est directe et métier : « Nouveau bulletin », « Saisie des résultats » et « Ticket introuvable ». La marque AYALAB positionne l’outil de laboratoire de l’EPHD d’Ayamé.

Le logo AYALAB utilise un symbole de microscope bleu profond sur la connexion, la barre latérale, le favicon et les métadonnées de la plateforme. Le nom de l’établissement, EPHD d’Ayamé, reste visible dans l’identité de l’interface.

## Limite de démonstration

Le flux métier est présenté avec des comptes et des patients entièrement fictifs. Les comptes de démonstration sont partagés et leurs identifiants sont publics. Bien que les entités initiales soient présentes dans les tables relationnelles, les modifications interactives sont synchronisées dans un instantané JSON complet : ce n’est pas encore un journal transactionnel par opération clinique. Aucune donnée patient réelle ne doit être saisie. Un déploiement opérationnel exige des comptes individuels, une traçabilité d’audit complète, des garanties de confidentialité et la validation réglementaire.
