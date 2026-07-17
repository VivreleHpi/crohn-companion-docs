# Analyse de risques — sécurité et santé

Chaque risque identifié est associé à une mesure de réduction. Statut au 4 juillet 2026.

## Risques techniques

| Risque | Impact | Mesure de réduction | Statut |
|---|---|---|---|
| Perte des données locales (effacement navigateur, perte d'appareil) | Perte de l'historique | Sauvegarde JSON restaurable + rappel de sauvegarde dans l'app | En place |
| Accès physique à l'appareil par un tiers | Lecture des données de santé | Relève du verrouillage de l'appareil ; verrouillage local (PIN) envisagé | À l'étude |
| Import d'un fichier JSON corrompu ou malveillant | Corruption des données | Validation Zod à l'import + confirmation explicite avant remplacement | En place |
| Suppression accidentelle | Perte définitive | Double confirmation avec saisie du mot SUPPRIMER | En place |
| Dépendances vulnérables | Compromission du build | Suivi des dépendances, builds Vercel reproductibles | Continu |

## Risques santé (les plus importants)

| Risque | Impact | Mesure de réduction | Statut |
|---|---|---|---|
| L'utilisateur croit à un diagnostic automatique | Retard de prise en charge | Disclaimer permanent, aucune formulation diagnostique, page Qualité & sécurité | En place |
| Rapport interprété comme donnée médicale vérifiée | Décision fondée sur des données déclaratives | Mention « données déclarées par le patient » sur le PDF + section limites + score de qualité du rapport | En place |
| Absence de saisie interprétée comme absence de symptôme | Sous-estimation | Encadré « Limites de lecture » dans le PDF + score de couverture | En place |
| Urgence non détectée par l'application | Danger vital | L'app ne fait aucun triage ; numéros d'urgence (15/112) rappelés dans le PDF | En place |
| Score HBI mal calculé ou mal compris | Mauvaise appréciation | Tests unitaires sur le calcul + libellés neutres de repère + relecture médicale à planifier | Partiel |

## Ce qui déclencherait une nouvelle analyse

- Tout ajout de backend ou de synchronisation cloud.
- Toute fonction d'interprétation automatique (IA, prédiction, alerte).
- Tout échange automatisé avec Mon espace santé ou un système tiers.
