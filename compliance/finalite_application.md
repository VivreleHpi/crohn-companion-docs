# Finalité de l'application

## Ce que fait CrohnApp

CrohnApp est un **carnet de suivi personnel** pour les personnes vivant avec une maladie
de Crohn ou une MICI. Il permet de :

- Consigner les selles (échelle de Bristol, sang, mucus), les symptômes, le suivi des prises
  déclarées des traitements, ainsi que le score Harvey-Bradshaw (HBI) calculé à partir des
  données déclarées (formule documentée dans `compliance/hbi_calcul.md`).
- Visualiser des tendances simples et explicables (fréquence, sévérité, prises renseignées).
- Générer une **synthèse des données déclarées pour la consultation** (PDF), avec un indicateur
  de complétude signalant si les saisies sont suffisantes pour être exploitables.
- Exporter ses données (CSV, sauvegarde JSON) et préparer un dépôt manuel de la synthèse dans
  **Mon espace santé**.

## Ce que ne fait pas CrohnApp

- **Pas de diagnostic** ni d'évaluation d'urgence automatique.
- **Pas de recommandation thérapeutique** ni d'ajustement de traitement.
- **Pas de prédiction de poussée**.
- Pas d'envoi automatique vers Mon espace santé ou le DMP (l'application n'est pas référencée
  au catalogue Mon espace santé).

## Statut

Application de suivi personnel. **Non revendiquée comme dispositif médical** ; elle n'a pas
encore fait l'objet d'une étude clinique destinée à démontrer son efficacité. La synthèse PDF
est un résumé de données déclarées par l'utilisateur, destiné à préparer une consultation ;
son interprétation relève d'un professionnel de santé.

Toute évolution de la destination d'usage ou des fonctionnalités, notamment l'analyse
individualisée, les alertes cliniques, la prédiction ou l'aide à la décision, devra faire
l'objet d'une nouvelle analyse réglementaire.
