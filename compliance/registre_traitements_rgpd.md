# Analyse RGPD — mode local

## Situation actuelle

CrohnApp fonctionne **entièrement en local** : les données de santé restent sur
l'appareil de l'utilisateur, sous son contrôle exclusif, à des fins strictement personnelles.
Dans cette configuration, l'éditrice n'a accès à aucune donnée de santé : elle n'en assure ni la
collecte, ni la transmission, ni la conservation. Les seuls traitements qui subsistent sont d'ordre
technique ou volontaire, et sont décrits ci-dessous. (Cadre de référence : recommandation CNIL
relative aux applications mobiles ; l'usage domestique par l'utilisateur relève de l'exemption
d'usage personnel.)

## Ce que l'éditeur traite malgré tout

| Traitement | Base | Détail |
|---|---|---|
| Hébergement du site statique | Intérêt légitime | Journaux techniques habituels de l'hébergeur (adresse IP, user-agent), non utilisés à des fins de profilage |
| Contact par e-mail (crohnapp@gmail.com) | Consentement | Uniquement si la personne écrit d'elle-même |

## Droits de l'utilisateur

Exercés directement dans l'application, sans intermédiaire et sans demande à adresser à
l'éditrice :

- **Accès et portabilité** : exports CSV et JSON lisibles, sauvegardes chiffrées du carnet et des
  photos.
- **Rectification** : édition directe de chaque entrée.
- **Effacement** : suppression entrée par entrée, ou remise à zéro complète depuis la page
  « Données et sauvegardes ». La suppression est locale et définitive.

Ces droits n'ont pas de contrepartie côté serveur : comme rien n'est conservé à distance, il n'y a
ni délai de réponse, ni copie résiduelle à purger.

## Si un backend est envisagé un jour

Le cadre devrait être entièrement réévalué **avant tout déploiement** : détermination des rôles
RGPD et des bases juridiques applicables, registre des traitements, examen de la nécessité d'une
analyse d'impact, politique de conservation, modalités d'exercice des droits, mesures de sécurité,
qualification du besoin d'hébergement certifié pour les données de santé, et gouvernance adaptée.

La nécessité de désigner un délégué à la protection des données, comme les modalités de recueil
d'un éventuel consentement, dépendraient de la finalité retenue et du cadre juridique applicable :
elles ne peuvent pas être présumées ici. **Aucun backend de données de santé ne sera déployé avant
que cette réévaluation ait été conduite.**
