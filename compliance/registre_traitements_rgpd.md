# Analyse RGPD — mode local

## Situation actuelle

Crohn Companion fonctionne **entièrement en local** : les données de santé restent sur
l'appareil de l'utilisateur, sous son contrôle exclusif, à des fins strictement personnelles.
Dans cette configuration, l'éditeur n'a accès à aucune donnée de santé et n'effectue aucun
traitement au sens opérationnel : il n'y a pas de collecte, pas de transmission, pas de
conservation côté éditeur. (Cadre de référence : recommandation CNIL relative aux applications
mobiles ; l'usage domestique par l'utilisateur relève de l'exemption d'usage personnel.)

## Ce que l'éditeur traite malgré tout

| Traitement | Base | Détail |
|---|---|---|
| Hébergement du site statique (Vercel) | Intérêt légitime | Logs techniques standards du CDN (adresses IP), non utilisés à des fins de profilage |
| Contact par email (crohnapp@gmail.com) | Consentement | Uniquement si l'utilisateur écrit de lui-même |

## Droits de l'utilisateur

Exercés directement dans l'application, sans intermédiaire :

- **Accès / portabilité** : exports CSV et sauvegarde JSON complète.
- **Rectification** : édition directe de toutes les entrées.
- **Effacement** : bouton « Réinitialiser l'application » (suppression définitive locale).

## Si un backend est envisagé un jour

Le cadre change entièrement : hébergement HDS, registre des traitements formel, DPIA,
consentement explicite, politique de conservation, DPO ou conseil juridique. **Aucun backend
de données de santé ne doit être déployé avant que ces prérequis soient remplis.**
