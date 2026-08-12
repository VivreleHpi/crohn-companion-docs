# Vérification des flux de données — CrohnApp

*Revue du 13 août 2026, portant sur CrohnApp v1.1.0.*

Ce document résume une vérification interne : est-ce que l'application envoie quelque chose
quelque part ? Il est écrit pour être lisible sans compétence technique. Le code source reste
privé ; une lecture peut être accordée sur demande motivée à
[crohnapp@gmail.com](mailto:crohnapp@gmail.com).

## Ce qui a été cherché

- des outils de mesure d'audience ou de suivi (statistiques, publicité, profilage) ;
- des services de rapport d'erreur automatique ;
- des ressources chargées depuis d'autres sites (polices, scripts) ;
- des envois de données vers un serveur, quel qu'il soit ;
- des données de santé qui se glisseraient dans une adresse web ou un journal technique.

## Ce qui a été constaté

| Sujet | Constat |
| --- | --- |
| Mesure d'audience, publicité, profilage | Aucun outil de ce type n'a été trouvé. |
| Rapport d'erreur automatique | Aucun service de ce type n'est utilisé. |
| Ressources chargées depuis un autre site | Aucune. Les polices utilisées sont celles du système. |
| Envoi de données vers un serveur | Aucun envoi initié par l'application n'a été trouvé. |
| Données de santé dans les adresses ou les journaux | Aucune. |
| Restriction du navigateur | L'application est publiée avec une règle qui interdit au navigateur de contacter d'autres sites. |

Les seuls liens vers l'extérieur sont des liens sur lesquels l'utilisateur choisit de cliquer :
la publication scientifique de référence du score HBI sur PubMed, le site public Mon espace santé,
les pages de contact de l'éditrice, et l'ouverture du logiciel de messagerie. Cliquer reste une
décision de l'utilisateur, et aucune donnée du carnet n'est placée dans ces liens.

## Où vivent les données

- Le carnet de suivi est enregistré sur l'appareil, dans un coffre chiffré qu'ouvre le mot de
  passe du profil.
- Les photos et les informations qui les accompagnent sont chiffrées dans un espace séparé.
- Seules des informations non cliniques restent en clair : l'identifiant du profil sur cet
  appareil et les préférences d'affichage.
- Les exports — CSV, JSON, sauvegardes chiffrées, PDF, PNG — sont fabriqués sur l'appareil et
  n'existent que si l'utilisateur les demande.

## Ce que cette vérification ne prouve pas

C'est une relecture interne, pas un audit indépendant. Le constat exact est « aucun envoi de
données de santé n'a été trouvé dans le périmètre examiné », et non « zéro risque ». En
particulier :

- une extension de navigateur, un appareil compromis ou une dépendance malveillante ne sont pas
  couverts par cette lecture ;
- la restriction imposée au navigateur limite les destinations possibles, mais ne prouve pas
  qu'un code injecté ne pourrait rien faire ;
- un contrôle du trafic réseau en conditions réelles reste souhaitable, de même qu'un audit de
  sécurité indépendant, qui n'a pas encore été réalisé.

## Quand refaire cette vérification

À chaque mise en production notable, et systématiquement si l'application venait à intégrer un
compte serveur, une synchronisation, une sauvegarde en ligne, une mesure d'audience ou un envoi
automatique de quoi que ce soit.
