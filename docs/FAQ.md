# Questions fréquentes sur CrohnApp

Cette FAQ répond aux situations les plus importantes. Pour une réponse plus détaillée, utilisez le
guide lié sous chaque question. Vous pouvez aussi ouvrir directement la page
[Aide et FAQ de CrohnApp](https://crohnapp.com/help).

## Comment mettre l'application à jour sur Android ?

Fermez complètement CrohnApp et les onglets `crohnapp.com`, puis rouvrez l'application avec Internet
actif. Si l'avis « Mise à jour disponible » apparaît, touchez **Rafraîchir**. La version active est
visible dans **Profil**.

Voir le guide : [mettre à jour CrohnApp](guides/mise-a-jour-pwa.md).

## Dois-je désinstaller CrohnApp pour recevoir une mise à jour ?

Non. Une installation récente doit se mettre à jour sans désinstallation. Ne désinstallez jamais
l'application et n'effacez jamais ses données avant d'avoir créé et vérifié une sauvegarde. Une très
ancienne installation peut nécessiter une réinstallation seulement après sauvegarde et vérification.

## Comment protéger mes données avant une réinstallation ou un changement de téléphone ?

Créez une sauvegarde clinique chiffrée depuis **Données et sauvegardes**. Si vous utilisez des photos,
exportez également leur sauvegarde chiffrée séparée. Gardez les fichiers et leurs mots de passe dans
des endroits distincts.

Voir le guide : [sauvegarder et restaurer](guides/sauvegarder-restaurer.md).

## Un mot de passe oublié peut-il être récupéré ?

Non. Le coffre est chiffré uniquement sur l'appareil. CrohnApp ne reçoit pas le mot de passe et ne
peut ni le connaître, ni le récupérer, ni le réinitialiser à distance. Une sauvegarde chiffrée exige
elle aussi son propre mot de passe.

Voir aussi : [sécurité des exports](EXPORT_SECURITY.md).

## Où sont stockées mes données ?

Elles restent par défaut dans le coffre chiffré du navigateur, sur l'appareil utilisé. Il n'existe ni
compte serveur, ni synchronisation automatique entre téléphones. Un export ne quitte l'appareil que
par votre action explicite.

Voir aussi : [flux de données documentés](../compliance/flux_donnees.md).

## Les analyses et le score HBI posent-ils un diagnostic ?

Non. Ils résument les informations déclarées et servent de support à la consultation. Ils ne
remplacent pas un professionnel de santé, ne prédisent pas une poussée et ne trient pas une urgence.
En cas d'urgence, appelez le 15 ou le 112.

Voir aussi : [méthode et limites du HBI](../compliance/hbi_calcul.md).

## Comment obtenir une image lisible d'un graphique ?

Dans **Analyses**, choisissez la période puis touchez **PNG** sur le graphique voulu. Le fichier haute
définition contient son titre, la période, la légende, la date d'export et la version de CrohnApp.

Voir le guide : [exporter une analyse en PNG](guides/exporter-analyses-png.md).

## Comment ajouter une photo à mon carnet ?

Dans **Photos**, l'onglet **Galerie** affiche les photos déjà enregistrées. L'onglet **Prendre une
photo** propose deux actions distinctes : **Prendre une photo** ouvre l'appareil photo, et
**Importer une image** ouvre la galerie ou les fichiers de l'appareil. Les photos sont chiffrées sur
l'appareil et ne sont jamais envoyées sur Internet.

## Une photo importée est refusée à cause de son format, que faire ?

Certains navigateurs ne savent pas lire les images **HEIC/HEIF**, le format produit par défaut par
les iPhone. CrohnApp le signale dès l'aperçu, avant l'enregistrement. Deux solutions : régler
**Réglages > Appareil photo > Formats** sur « Plus compatible » sur l'iPhone, ou convertir la photo
en JPEG avant de l'importer.

## Quand les rappels de CrohnApp s'affichent-ils ?

Les rappels de traitement, de rendez-vous et le résumé quotidien sont **locaux** : ils sont produits
sur l'appareil, sans serveur. Ils s'affichent une fois les notifications autorisées, tant que
CrohnApp est ouverte ou active en arrière-plan. Si le navigateur n'affiche pas la notification,
l'application vous le signale et le rappel reste programmé.

**Le déclenchement lorsque l'application est complètement fermée n'est pas garanti.** Pour être
averti de façon fiable dans ce cas, utilisez le bouton **Agenda** d'un rendez-vous : le fichier
`.ics` ajoute l'événement à Google Agenda, Samsung Calendar ou Apple Calendrier, qui sonnera à votre
place. Ces rappels ne sont pas des alarmes médicales.

## Comment signaler un problème ?

Écrivez à [crohnapp@gmail.com](mailto:crohnapp@gmail.com) en indiquant le modèle du téléphone, la
version Android ou du navigateur, la version de CrohnApp visible dans **Profil**, et les étapes qui
ont précédé le problème. N'envoyez aucune donnée de santé ni aucun fichier de sauvegarde.
