# Statut dispositif médical et frontières à ne pas franchir

## Statut actuel

Crohn Companion est un **carnet de suivi personnel**, non revendiqué comme dispositif médical.
Sa qualification réglementaire doit être confirmée par un conseil juridique et réglementaire avant
toute mise sur le marché. Ses signaux de suivi ne sont ni validés cliniquement ni destinés à un
diagnostic ou à une décision thérapeutique.

## Fonctions actuelles compatibles avec ce statut

- Journal de selles, symptômes, traitements et scores déclarés.
- Statistiques descriptives (moyennes, fréquences, tendances affichées avec leurs signaux).
- Rapport PDF de synthèse « données déclarées par le patient » avec score de qualité de saisie.
- Exports contrôlés par l'utilisateur.

## Fonctions qui feraient basculer vers le statut de dispositif médical

À ne PAS implémenter sans stratégie réglementaire (marquage CE, classe IIa minimum) :

- Diagnostic ou suggestion de diagnostic (« vous êtes en poussée »).
- Recommandation ou modification de traitement.
- Triage d'urgence automatique (« vous pouvez attendre » / « consultez immédiatement »).
- Prédiction de poussée ou score de risque présenté comme fiable.
- Alerte clinique automatisée adressée à un professionnel de santé.

## Règles de rédaction dans l'application

- Toute synthèse est formulée comme un **constat de données déclarées**, jamais comme un avis.
- Les signaux sont accompagnés de « à discuter avec votre médecin ».
- Le disclaimer médical est permanent et le PDF rappelle les numéros d'urgence (15 / 112).
- La France (`fr-FR`) est le seul pays activé. Toute nouvelle locale est bloquée jusqu'à la revue
  juridique et clinique définie dans `docs/international-rollout.md`.
