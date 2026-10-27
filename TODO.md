# Suivi de réalisation — Laboratoire EPHD d’Ayamé

## Accès et rôles
- [x] **Connexion et menus par rôle** — Les rôles sont accueil, auxiliaire, technicien et responsable. La connexion se fait par identifiant et mot de passe. Chaque rôle ne voit que ses menus.

## Dossiers patients et prescripteurs
- [x] **Patients** — Création, modification, recherche et fiche patient avec historique des analyses. Un patient est externe ou hospitalisé ; s’il est hospitalisé, le numéro de dossier et le numéro de lit sont obligatoires.
- [x] **Prescripteurs** — Gérer les champs nom, prénoms et spécialité.

## Circuit des analyses
- [x] **Bulletins d’analyse et tickets** — Un bulletin associe un patient, un prescripteur, un ou plusieurs types d’analyse et un motif. À l’enregistrement, générer un numéro de ticket unique et un ticket de retrait imprimable. Les statuts sont exactement : Enregistré → Prélevé → En analyse → Résultats saisis → Remis.
- [x] **Résultats** — Pour chaque paramètre, saisir la valeur mesurée, l’unité et les valeurs de référence min/max ; associer le technicien. Calculer automatiquement l’interprétation Normal / Inférieur / Supérieur à la saisie. Les résultats décrémentent le stock des réactifs associés et sont refusés si un réactif lié est périmé ou si le stock est insuffisant.
- [x] **Remise des résultats** — Rechercher par numéro de ticket ; refuser clairement un ticket invalide. Fournir un compte rendu imprimable en PDF.

## Référentiels et réactifs
- [x] **Catalogue** — Gérer les types d’analyse des disciplines hématologie, biochimie, parasitologie et immunologie ainsi que leurs paramètres, unités, valeurs de référence et produits associés.
- [x] **Produits (réactifs)** — Afficher la quantité en stock, la date d’ouverture et la date de péremption. Signaler visuellement les produits périmés ou bientôt périmés. Un produit périmé ne peut pas être utilisé ; le stock baisse à chaque utilisation.

## Pilotage, données et présentation
- [x] **Tableau de bord** — Montrer les bulletins du jour par statut, les résultats prêts à remettre et les produits à surveiller.
- [x] **Données de démonstration et persistance** — Fournir environ 30 patients aux noms ivoiriens, 10 prescripteurs, 4 techniciens, des paramètres médicaux réalistes avec valeurs de référence (NFS, glycémie, créatinine, goutte épaisse, etc.), 15 produits dont certains proches de la péremption et une quarantaine de bulletins à différents statuts. Le schéma de données couvre patient, prescripteur, technicien, type_analyse, parametre (lié à un type_analyse), produit, bulletin_analyse (lié à patient et prescripteur), resultat (lié à bulletin, parametre, technicien), bulletin–type_analyse et parametre–produit. Les sessions et l’instantané d’état partagé sont persistés dans MySQL ; les lignes de démonstration sont peuplées par seed idempotent.
- [x] **Interface** — Interface 100 % en français, sobre et professionnelle : fond blanc ou gris très clair, une seule couleur d’accent bleu profond, police Inter, barre latérale fixe à gauche, tableaux denses et lisibles. Pas de dégradés, pas d’emojis, pas d’illustrations décoratives, animations minimales. Textes courts et directs, vocabulaire du laboratoire, aucun slogan ni lorem ipsum. Le logo AYALAB (symbole de microscope) apparaît sur la connexion, la navigation, le favicon et les métadonnées du projet ; l’EPHD d’Ayamé reste identifié comme établissement.
