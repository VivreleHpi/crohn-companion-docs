# Sauvegardes et exports : ce qui est protégé, ce qui ne l'est pas

*État au 13 août 2026, CrohnApp v1.1.0.*

## Choisir le bon format

| Format | Contenu | Protection une fois le fichier téléchargé |
| --- | --- | --- |
| CSV ou JSON lisible | Données du carnet, en clair | Aucune : toute personne qui obtient le fichier peut le lire |
| Sauvegarde du carnet, chiffrée | Profil, selles, symptômes, traitements, rendez-vous, scores | Protégée par un mot de passe de sauvegarde |
| Sauvegarde des photos, chiffrée | Images et informations associées | Fichier distinct, avec son propre mot de passe |
| Synthèse PDF, graphique PNG | Document lisible destiné à être montré | Aucune : vérifier le destinataire avant de partager |

Les sauvegardes chiffrées utilisent AES-GCM 256 bits, avec une clé dérivée du mot de passe par
PBKDF2-SHA-256 (600 000 itérations) et des valeurs aléatoires renouvelées à chaque export. Un
mot de passe incorrect ou un fichier modifié est rejeté plutôt que restauré partiellement.

## Deux sauvegardes, pas une

La sauvegarde du carnet et la sauvegarde des photos sont deux fichiers séparés. Aucune des deux
ne restaure le contenu de l'autre. Si vous avez des photos, il faut donc conserver les deux.

## Ce que personne ne peut faire pour vous

CrohnApp n'enregistre pas les mots de passe de sauvegarde et ne peut pas les réinitialiser. Il n'y
a pas de copie sur un serveur : un mot de passe perdu signifie une sauvegarde définitivement
illisible. Conservez chaque fichier et son mot de passe à des endroits distincts.

## Aller plus loin

Pour la marche à suivre pas à pas, voir le guide
[Créer et restaurer une sauvegarde chiffrée](guides/sauvegarder-restaurer.md). Pour une question
technique sur les formats ou une demande de lecture du code :
[crohnapp@gmail.com](mailto:crohnapp@gmail.com).
