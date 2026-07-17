# Politique d'export et de suppression des données

## Exporter ses données

Depuis la page **Gestion des données** :

1. **CSV** : selles, symptômes et traitements, exploitables dans un tableur.
2. **Sauvegarde JSON** : sauvegarde complète restaurable sur cette application, y compris sur
   un autre appareil. Ce fichier est en clair ; une sauvegarde chiffrée par mot de passe doit
   être préférée lorsqu'elle est disponible.
3. **Rapport PDF** : synthèse pour consultation, nommée `rapport_crohn_companion_AAAA-MM-JJ.pdf`.

## Supprimer ses données

1. **Suppression ciblée** : chaque entrée (selle, symptôme, traitement, photo…) peut être
   supprimée individuellement depuis son écran.
2. **Suppression totale** : page Gestion des données → « Réinitialiser l'application »,
   avec double confirmation (saisie du mot SUPPRIMER). Efface définitivement historiques,
   photos, profil, traitements et rendez-vous.
3. La suppression est **immédiate et irréversible** : les données n'existant que sur l'appareil,
   il n'y a aucune copie serveur à purger.

## Points d'attention pour l'utilisateur

- Vider les données de navigation du navigateur peut effacer les données de l'application :
  faire des sauvegardes JSON régulières (un rappel existe dans l'application).
- Les fichiers exportés (CSV, JSON, PDF) sont sous la responsabilité de l'utilisateur une fois
  téléchargés : les stocker dans un endroit sûr.
- Le mot de passe du coffre et celui d'une sauvegarde chiffrée ne sont jamais conservés par
  l'application et ne peuvent pas être réinitialisés sans la sauvegarde et son secret.
- Après rechargement du navigateur, le coffre est verrouillé jusqu'à une nouvelle saisie du
  mot de passe ; cette mesure empêche une session locale de rester ouverte indéfiniment.
