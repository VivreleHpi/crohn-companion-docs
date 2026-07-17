# Déploiement international : barrière de sécurité

Le produit est actuellement configuré pour la France (`fr-FR`) uniquement. Aucun deuxième pays, numéro d'urgence, contenu clinique ou revendication de conformité ne doit être activé par une simple traduction.

## Prérequis obligatoires par pays

1. Avis juridique local documenté : qualification réglementaire, protection des données, consentement, hébergement et conditions d'utilisation.
2. Revue clinique locale documentée : parcours de soins, libellés, sources, contenu éducatif et messages d'urgence.
3. Validation par des utilisateurs locaux, accessibilité et traduction professionnelle avec relecture médicale.
4. Analyse de risque mise à jour, tests de fuseau/unité/export, audit sécurité externe et audit conformité avant pilote.
5. Pilote limité, procédure de retrait, métriques de sécurité et revue de sortie indépendante avant généralisation.

## État de la barrière

`src/lib/i18n.ts` ne publie que `fr-FR`. L'ajout d'une locale ou d'un pays est une modification contrôlée qui exige les cinq preuves ci-dessus dans la revue de changement.
