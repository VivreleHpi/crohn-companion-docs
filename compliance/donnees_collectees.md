# Données traitées et stockage

Aucune donnée n'est « collectée » au sens d'une transmission à un serveur : toutes les données
ci-dessous sont **saisies par l'utilisateur et stockées uniquement sur son appareil**.

## Inventaire

| Donnée | Exemples | Stockage | Sensibilité |
|---|---|---|---|
| Profil | nom, email, téléphone, médecin traitant, groupe sanguin, type de maladie, année de diagnostic, poids/taille | localStorage | Donnée de santé |
| Selles | type Bristol, sang, mucus, date/heure, notes | localStorage | Donnée de santé |
| Symptômes | nom, sévérité (0–4), date/heure, notes | localStorage | Donnée de santé |
| Traitements | nom, dosage, fréquence, prises planifiées et déclarées | localStorage | Donnée de santé |
| Scores HBI | score, repère indicatif, date | localStorage | Donnée de santé |
| Photos cliniques | photos optionnelles prises par l'utilisateur | IndexedDB | Donnée de santé |
| Rendez-vous | date, type, notes | localStorage | Donnée de santé |
| Préférences | thème, rappels, date du dernier export | localStorage | Technique |

## Sorties de données (toujours à l'initiative de l'utilisateur)

- Export CSV et sauvegarde JSON : fichiers téléchargés sur l'appareil.
- Rapport PDF : généré localement dans le navigateur, puis téléchargé ou partagé via le
  partage natif de l'appareil.
- Dépôt Mon espace santé : manuel, effectué par l'utilisateur depuis son propre compte.

## Ce qui n'existe pas

- Pas de compte serveur, pas de synchronisation cloud.
- Pas d'analytics tiers, pas de cookies publicitaires, pas de SDK de tracking.
- Pas de transmission de données de santé à l'éditeur de l'application.
