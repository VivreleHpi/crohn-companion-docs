# Journal des changements notables (conformité et sécurité)

## Politique de tenue du journal

À compter du 12 août 2026, chaque mise en production notable de CrohnApp est documentée ici :
nouvelles fonctionnalités, corrections visibles, changements touchant la confidentialité, la
sécurité, les calculs ou la conservation des données. La documentation technique privée est tenue
à jour pendant le développement ; ce journal public est synchronisé lors de la mise en production,
après vérification du site et, lorsque nécessaire, de la PWA installée.

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
