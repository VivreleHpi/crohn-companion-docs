# Dossier conformité — CrohnApp

Ce dossier documente la finalité, les données, les risques et les engagements de CrohnApp.
Il est rédigé pour être lisible par un non-technicien et reflète le fonctionnement réel de
l'application en v1.1.0, au 13 août 2026 :

- Application web installable, servie sous forme de fichiers statiques.
- **Les données de santé restent sur l'appareil** : le carnet de suivi dans un coffre chiffré, les
  photos dans un espace chiffré séparé. Aucune base de données distante.
- Aucun compte serveur : le profil et son mot de passe sont locaux.
- Aucune donnée de santé ne quitte l'appareil sans une action explicite de l'utilisateur
  (export, sauvegarde, PDF, partage).
- Aucun outil de mesure d'audience ni traceur publicitaire.

## Contenu

| Fichier | Objet |
|---|---|
| [finalite_application.md](finalite_application.md) | Ce que fait l'application et ce qu'elle ne fait pas |
| [donnees_collectees.md](donnees_collectees.md) | Inventaire des données traitées et de leur stockage |
| [flux_donnees.md](flux_donnees.md) | Où vont les données et ce qui ne sort pas de l'appareil |
| [registre_traitements_rgpd.md](registre_traitements_rgpd.md) | Analyse RGPD adaptée au mode local |
| [politique_suppression_donnees.md](politique_suppression_donnees.md) | Sauvegarder, exporter et supprimer ses données |
| [analyse_risque_securite.md](analyse_risque_securite.md) | Risques identifiés et mesures de réduction |
| [sources_cliniques.md](sources_cliniques.md) | Références des scores et échelles utilisés |
| [hbi_calcul.md](hbi_calcul.md) | Formule, source, seuils et version du calcul HBI |
| [limites_dispositif_medical.md](limites_dispositif_medical.md) | Statut non-DM et frontières à ne pas franchir |
| [preuves_ia_exigences.md](preuves_ia_exigences.md) | État des preuves, IA et exigences avant toute évolution |
| [plan_validation_clinique.md](plan_validation_clinique.md) | Plan de validation terrain (beta) |
| [journal_changements.md](journal_changements.md) | Journal des évolutions notables |

Ce dossier est une aide produit ; il ne constitue ni un avis juridique ni un avis médical. Pour
une question technique précise ou une demande de lecture du code, qui reste privé :
[crohnapp@gmail.com](mailto:crohnapp@gmail.com).
