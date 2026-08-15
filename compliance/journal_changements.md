# Journal des changements notables (conformité et sécurité)

## Politique de tenue du journal

À compter du 12 août 2026, chaque mise en production notable de CrohnApp est documentée ici :
nouvelles fonctionnalités, corrections visibles, changements touchant la confidentialité, la
sécurité, les calculs ou la conservation des données. La documentation technique privée est tenue
à jour pendant le développement ; ce journal public est synchronisé lors de la mise en production,
après vérification du site et, lorsque nécessaire, de la PWA installée.

## v1.2.3 — 2026-08-16

- L'ancienne adresse de la bêta détecte désormais la présence éventuelle d'un carnet local avant
  de rediriger vers `crohnapp.com`.
- Lorsqu'un carnet est présent, CrohnApp indique comment effectuer une sauvegarde puis poursuivre
  sur l'adresse actuelle.
- Les données restent locales à l'appareil et ne sont pas transférées automatiquement entre deux
  adresses web.

## v1.2.2 — 2026-08-15

- Version produit portée à 1.2.2, consultable dans **Profil**.
- Synthèse pour la consultation : depuis un carnet personnel, l'action
  **Télécharger ou Partager le PDF** remet à nouveau le fichier, avec le résumé
  qui l'accompagne. Le partage natif du téléphone est utilisé lorsqu'il est
  disponible, sinon le fichier est téléchargé.

## v1.2.1 — 2026-08-15

- Version produit portée à 1.2.1, consultable dans **Profil**.
- Fin de session démo : le coffre fictif lui-même est retiré de l'appareil, et
  pas seulement son contenu. Après la sortie de la démonstration, il ne reste ni
  données ni conteneur de démonstration dans le stockage du navigateur.

## v1.2.0 — 2026-08-14

- Version produit portée à 1.2.0, consultable dans **Profil**.
- Profil démo : la saisie est enregistrée et conservée pendant toute la session — selles, symptômes,
  traitements, repère HBI et photos. Le parcours de démonstration peut donc être essayé de bout en
  bout, sans créer de carnet.
- Le contenu saisi dans le profil démo est effacé de l'appareil à la sortie de la démonstration et,
  au plus tard, à la fin de la session de 24 heures. Cette durée court à partir du démarrage de la
  démonstration.
- Le profil démo n'accepte pas l'import d'une sauvegarde. La restauration demande un carnet
  personnel ; l'export et la sauvegarde chiffrée restent disponibles en démonstration.
- Le planning des traitements fictifs reste identique à chaque ouverture de la démonstration. Un
  traitement ajouté par la personne qui teste suit, lui, le fonctionnement normal.
- Les rappels système ne sont pas activés sur le profil démo.

## v1.1.1 — 2026-08-14

- Version produit portée à 1.1.1, consultable dans **Profil**.
- Photos : l'onglet « Prendre une photo » distingue deux actions, **Prendre une photo** qui ouvre
  l'appareil photo et **Importer une image** qui ouvre la galerie ou les fichiers de l'appareil.
- Une image que le navigateur ne sait pas décoder, notamment un HEIC/HEIF d'iPhone, est signalée dès
  l'aperçu, avec la marche à suivre.
- Rappels locaux : l'affichage des notifications passe par le service worker de la PWA. Lorsque le
  navigateur n'affiche pas une notification, l'application le signale et le rappel reste programmé.
- Le déclenchement d'un rappel application complètement fermée n'est pas garanti et reste à valider.
  L'export agenda (`.ics`) demeure le moyen fiable d'être averti hors application.
- Pages publiques : données structurées déclarées page par page, et dates de dernière révision du
  plan de site fondées sur la révision réelle de chaque page plutôt que sur la date de publication.
- Libellé « Créer mon carnet » harmonisé sur les pages publiques.

## v1.1.0 — 2026-08-13

- Ajout d'une page « Aide et FAQ » accessible sans ouvrir de carnet, avec des liens directs vers
  les guides publics de mise à jour, de sauvegarde, de restauration et d'analyse.
- Refonte de l'export PNG des graphiques : image haute définition, titre et période explicites,
  légende lisible, date d'export et version de CrohnApp.
- Ajout d'un contrôle automatique du format et des dimensions du PNG sur un écran Android simulé.
- Publication d'un guide mobile illustré consacré à l'export des analyses.

## v1.0.0 — 2026-08-13

- Correction de plusieurs calculs et restitutions afin que les synthèses correspondent exactement
  aux données déclarées : regroupement hebdomadaire, période du rapport et valeurs absentes.
- Renforcement du coffre local chiffré lors d'un changement de mot de passe et des écritures
  concurrentes, afin d'éviter une perte d'accès à l'historique.
- La restauration et l'enregistrement de photos ne signalent désormais un succès qu'après
  l'écriture locale effective ; les échecs restent visibles pour éviter les doublons.
- Amélioration des mises à jour de la PWA installée : vérification au lancement, au retour dans
  l'application et au rétablissement du réseau. Un avis « Mise à jour disponible » permet de
  rafraîchir explicitement CrohnApp lorsque la nouvelle version est prête.
- Ajout d'une confirmation visible après activation d'une version et de son identifiant dans le
  profil. L'utilisateur peut ainsi vérifier la version installée même lorsque Chrome a appliqué
  la mise à jour silencieusement pendant que la PWA était fermée.
- Renforcement des tests automatiques sur le chiffrement, les calculs cliniques, les exports et
  les parcours ordinateur/mobile.

## 2026-07-04

- Création du dossier `/compliance` aligné sur l'architecture réelle (100 % local, pas de backend santé).
- Rapport PDF : ajout d'un **score de qualité du rapport** (jours renseignés, couverture de la
  période, types de données présents, note faible/correct/bon).
- Nommage standardisé du rapport : `rapport_crohn_companion_AAAA-MM-JJ.pdf`.
- Ajout du parcours « **Préparer pour Mon espace santé** » (dépôt manuel guidé, wording honnête :
  pas d'envoi automatique, application non référencée au catalogue).
- Retrait des mentions d'« ambition internationale » des pages Introduction et Qualité & sécurité.
- Ajout de la page « Participer à la beta » (validation terrain, étape 1).

## Antérieur (extraits de l'historique git)

- Notifications configurables, export agenda .ics, corrections profil/photos.
- Profil médical étendu, QR code et liens dans le PDF.
- Graphiques compatibles mode sombre, rappel de sauvegarde locale.
- Badge Beta visible (sidebar, header mobile, homepage).
