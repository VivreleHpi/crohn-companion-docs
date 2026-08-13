# Analyse de risques — sécurité et santé

Chaque risque identifié est associé à une mesure de réduction. Statut révisé au 13 août 2026,
CrohnApp v1.1.0.

## Risques techniques

| Risque | Impact | Mesure de réduction | Statut |
|---|---|---|---|
| Perte des données locales (effacement navigateur, perte d'appareil) | Perte de l'historique | Sauvegardes chiffrées du carnet et des photos, restaurables, avec rappel dans l'application | En place |
| Accès physique à l'appareil par un tiers | Lecture des données de santé | Carnet et photos chiffrés, reverrouillage après rechargement, verrouillage de l'appareil | En place |
| Import d'un fichier de sauvegarde corrompu ou malveillant | Corruption des données | Contrôle du contenu à l'import et confirmation explicite avant tout remplacement | En place |
| Suppression accidentelle | Perte définitive | Double confirmation avec saisie du mot SUPPRIMER | En place |
| Dépendances vulnérables | Compromission du build | Suivi des dépendances, builds Vercel reproductibles | Continu |

## Risques santé (les plus importants)

| Risque | Impact | Mesure de réduction | Statut |
|---|---|---|---|
| L'utilisateur croit à un diagnostic automatique | Retard de prise en charge | Disclaimer permanent, aucune formulation diagnostique, page Qualité & sécurité | En place |
| Rapport interprété comme donnée médicale vérifiée | Décision fondée sur des données déclaratives | Mention « données déclarées par le patient » sur le PDF + section limites + score de qualité du rapport | En place |
| Absence de saisie interprétée comme absence de symptôme | Sous-estimation | Encadré « Limites de lecture » dans le PDF + score de couverture | En place |
| Urgence non détectée par l'application | Danger vital | L'app ne fait aucun triage ; numéros d'urgence (15/112) rappelés dans le PDF | En place |
| Score HBI mal calculé ou mal compris | Mauvaise appréciation | Calcul regroupé dans une source unique et couvert par des tests, libellés neutres de repère, relecture médicale à planifier | Partiel |
| Perte du mot de passe du coffre ou d'une sauvegarde | Perte définitive de l'accès | Avertissement explicite : aucune récupération n'est possible, ni localement ni à distance | En place |

## Limites assumées

Un audit de sécurité indépendant n'a pas encore été réalisé, et la relecture clinique par un
professionnel reste à obtenir. Ces deux points sont des conditions préalables à un usage élargi,
pas des cases déjà cochées.

## Ce qui déclencherait une nouvelle analyse

- Tout ajout de backend ou de synchronisation cloud.
- Toute fonction d'interprétation automatique (IA, prédiction, alerte).
- Tout échange automatisé avec Mon espace santé ou un système tiers.
