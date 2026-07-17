# Vérification documentée des flux de données (« local-first »)

> Date de vérification : 2026-07-16
> Méthode : revue du code source (`src/`), recherche de clients réseau
> (`createClient`, `fetch`, SDK Supabase/Sentry/analytics) et des points de stockage
> (`localStorage`, `IndexedDB`). À refaire avant toute release qui ajoute un flux réseau.

La formulation publique autorisée par cette vérification est :
« Les données sont enregistrées localement par défaut. L'utilisateur peut consulter,
modifier, exporter et supprimer les données enregistrées dans l'application. »
Les formulations absolues (« 100 % privé », « aucune donnée collectée », « conforme
RGPD santé », « chiffrement intégral », etc.) restent interdites.

| Flux | État vérifié (2026-07-16) |
| --- | --- |
| Stockage local | Données saisies dans un coffre local (`src/lib/mockDb.ts`, `src/lib/secureVault.ts`) sur `localStorage`, photos dans IndexedDB (`src/lib/photoDb.ts`). |
| Compte et authentification | Authentification locale uniquement (`src/contexts/AuthContext`, `src/lib/authRateLimit.ts`). Aucun serveur d'identité, pas de « mot de passe oublié » distant. |
| Base de données distante | Aucune. Les hooks `src/hooks/supabase/*` portent un nom hérité mais encapsulent le stockage local (`mockDb`) ; aucun client Supabase (`createClient`) n'est présent. |
| Sauvegardes | Export/restauration JSON manuels, fichiers générés côté client (`src/lib/exportData.ts`, `src/lib/photoBackup.ts`, `src/lib/backupIdentity.ts`). Aucune sauvegarde automatique distante. |
| Synchronisation | Aucune synchronisation multi-appareils. |
| Photos et pièces jointes | IndexedDB local (`src/lib/photoDb.ts`) ; jamais téléversées (`PhotoGallery`). Incluses dans le PDF uniquement à la demande de l'utilisateur. |
| Analytics | Aucun SDK ni script analytics (pas de gtag/plausible/posthog). La page « Analyses » est un calcul local. |
| Rapports de crash | Aucun SDK (pas de Sentry ou équivalent). |
| Journaux techniques | `console.*` uniquement, restent dans le navigateur. |
| API externes | Aucun appel réseau applicatif. Le QR code du PDF est généré localement (lib `qrcode`). Lien Facebook sortant statique, sans SDK ni traqueur (`src/components/FacebookCta.tsx`, CSP `default-src 'self'`). |
| Export PDF | Généré côté client (jsPDF, `src/lib/generatePDF.ts`), jamais envoyé à un serveur par l'application. |
| Partage | Web Share API du système (`src/lib/sharePDF.ts`) : l'utilisateur choisit explicitement le destinataire ; sinon téléchargement local. |
| QR codes | Générés localement ; contenu = URL publique de l'application, aucune donnée de santé. |
| E-mails | Liens `mailto:` uniquement (client mail de l'utilisateur) ; l'application n'envoie aucun e-mail. |
| Liens publics | Aucun mécanisme de lien public vers des données utilisateur. |

## Flux d'hébergement (hors données de santé)

L'application est servie par Vercel (fichiers statiques, PWA). Comme tout hébergeur,
Vercel voit les requêtes HTTP de chargement (adresse IP, user-agent). Aucune donnée
saisie dans l'application n'est transmise dans ces requêtes.

## Conditions de réévaluation

Cette vérification devient caduque et les formulations publiques doivent être
adaptées si l'un de ces éléments est ajouté : compte serveur, base distante
(Supabase ou autre), synchronisation, sauvegarde cloud, analytics, rapport de
crash automatique, envoi d'e-mails, ou tout appel API transportant des données
utilisateur.
