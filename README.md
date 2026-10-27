# AYALAB — Laboratoire EPHD d’Ayamé

Application de démonstration en français pour le suivi des dossiers patients, bulletins d’analyse, résultats, remise des comptes rendus, catalogue et réactifs. Le symbole AYALAB identifie l’application ; l’établissement reste l’EPHD d’Ayamé.

## Accès de démonstration

Les profils sont `accueil`, `auxiliaire`, `technicien` et `responsable`. Le mot de passe de démonstration commun est `Ayame2026!`. Les menus sont adaptés au rôle. Les mots de passe sont hachés en base, mais ces identifiants partagés sont publics et réservés à la démonstration.

## Données et limites d’usage

Le jeu fourni comprend 30 patients fictifs aux noms ivoiriens, 10 prescripteurs, 4 techniciens, 9 types d’analyse, 15 réactifs et 40 bulletins couvrant les cinq statuts. Les entités sont initialisées dans la base MySQL gérée. Les sessions serveur sont persistantes et les changements d’interface sont synchronisés vers une sauvegarde partagée dédiée.

Le schéma relationnel est décrit dans `drizzle/schema.ts`. Le jeu est une démonstration fonctionnelle : les modifications de l’interface sont encore enregistrées comme un instantané JSON partagé et ne constituent pas un workflow clinique transactionnel sur les tables individuelles. Ne pas saisir de données de santé réelles. Avant tout usage opérationnel, remplacer les identifiants publics par des comptes nominatifs, compléter l’audit médical, la traçabilité des remises, les sauvegardes et la validation réglementaire.

## Développement

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
pnpm db:push
pnpm db:seed
```
