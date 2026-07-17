# Dossier conformité — Crohn Companion

Ce dossier documente la finalité, les données, les risques et les engagements de Crohn Companion.
Il est rédigé pour être lisible par un non-technicien et reflète l'**architecture réelle** de
l'application au 4 juillet 2026 :

- Application web statique (React/Vite) hébergée sur Vercel.
- **Toutes les données de santé sont stockées localement** sur l'appareil de l'utilisateur
  (localStorage et IndexedDB pour les photos). Aucun backend santé, aucune base de données distante.
- Aucun compte serveur : l'« authentification » est un profil local sur l'appareil.
- Aucune donnée de santé ne quitte l'appareil sans action explicite de l'utilisateur
  (export CSV/JSON, génération PDF, partage natif).
- Pas d'outil d'analytics tiers ni de traceur publicitaire.

## Contenu

| Fichier | Objet |
|---|---|
| [finalite_application.md](finalite_application.md) | Ce que fait l'application et ce qu'elle ne fait pas |
| [donnees_collectees.md](donnees_collectees.md) | Inventaire des données traitées et de leur stockage |
| [registre_traitements_rgpd.md](registre_traitements_rgpd.md) | Analyse RGPD adaptée au mode local |
| [politique_suppression_donnees.md](politique_suppression_donnees.md) | Comment supprimer / exporter ses données |
| [analyse_risque_securite.md](analyse_risque_securite.md) | Risques identifiés et mesures de réduction |
| [sources_cliniques.md](sources_cliniques.md) | Références des scores et échelles utilisés |
| [limites_dispositif_medical.md](limites_dispositif_medical.md) | Statut non-DM et frontières à ne pas franchir |
| [plan_validation_clinique.md](plan_validation_clinique.md) | Plan de validation terrain (beta) |
| [journal_changements.md](journal_changements.md) | Journal des évolutions notables |

Ce dossier est une aide produit ; il ne constitue ni un avis juridique ni un avis médical.
