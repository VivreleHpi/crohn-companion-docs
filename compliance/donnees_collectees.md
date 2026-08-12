# Données traitées et stockage

*État au 13 août 2026, CrohnApp v1.1.0.*

Les informations ci-dessous sont saisies par l'utilisateur et restent sur son appareil. Elles ne
sont pas transmises à l'éditrice. L'hébergeur sert les fichiers de l'application et traite les
requêtes de chargement habituelles, mais ne reçoit pas le contenu du carnet.

## Inventaire

| Donnée | Exemples | Où elle est enregistrée | Protection |
| --- | --- | --- | --- |
| Profil | coordonnées, médecin, type de maladie, année de diagnostic, poids et taille | Coffre local chiffré | Chiffrée |
| Selles | type Bristol, sang, mucus, date et heure, notes | Coffre local chiffré | Chiffrée |
| Symptômes | nom, sévérité, date et heure, notes | Coffre local chiffré | Chiffrée |
| Traitements | nom, dosage, fréquence, prises déclarées | Coffre local chiffré | Chiffrée |
| Scores HBI | score, repère indicatif, date | Coffre local chiffré | Chiffrée |
| Rendez-vous | date, type, notes | Coffre local chiffré | Chiffrée |
| Photos cliniques | image, miniature, type, notes, date | Espace photos séparé, également chiffré | Chiffrée |
| Identité locale | l'identifiant du profil sur cet appareil | Stockage simple du navigateur | Non clinique ; sert à retrouver le bon coffre |
| Préférences | thème, langue, rappels, tutoriels vus | Stockage simple du navigateur | Non clinique |

Le coffre est déverrouillé par le mot de passe du profil. Ce mot de passe n'est jamais enregistré
et ne peut pas être réinitialisé à distance. Après un rechargement, un profil réel se reverrouille.

Dans l'espace photos, seules quelques étiquettes techniques restent lisibles : elles permettent de
séparer les profils et de supprimer les photos même lorsque le coffre est verrouillé. Les images,
leurs miniatures et les informations qui les accompagnent sont chiffrées.

## Sorties déclenchées par l'utilisateur

- **CSV et JSON lisibles** : pratiques pour réutiliser ses données ailleurs, mais lisibles par
  toute personne qui obtient le fichier.
- **Sauvegarde du carnet, chiffrée** : protégée par un mot de passe de sauvegarde distinct.
- **Sauvegarde des photos, chiffrée** : fichier séparé, avec son propre mot de passe.
- **Synthèse PDF et graphiques PNG** : produits sur l'appareil, puis téléchargés ou partagés si
  l'utilisateur le demande.
- **Dépôt dans Mon espace santé** : manuel, réalisé par l'utilisateur depuis son propre compte.

## Ce qui n'existe pas

- aucun compte serveur, aucune synchronisation entre appareils ;
- aucun outil de mesure d'audience, cookie publicitaire ou traceur ;
- aucune récupération ni réinitialisation du mot de passe à distance ;
- aucune transmission automatique des données de santé à l'éditrice.

## Aller plus loin

Ce document reste volontairement non technique. Pour une question précise sur l'implémentation ou
une demande de lecture du code : [crohnapp@gmail.com](mailto:crohnapp@gmail.com).
