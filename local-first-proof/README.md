# Preuve du fonctionnement local-first

Ce dossier contient un **extrait ponctuel** (pas un miroir synchronisé) des modules de l'application réelle qui portent la promesse « aucune donnée de santé ne quitte l'appareil sans action explicite ». Il ne s'agit pas de l'application complète : l'UI, les autres écrans et la logique produit restent dans le dépôt privé.

## Ce que ces fichiers montrent

- **`src/lib/secureVault.ts`** — chiffrement local : `crypto.subtle` natif du navigateur, AES-GCM-256, clé dérivée par PBKDF2-SHA-256 (600 000 itérations), stockage dans IndexedDB. Aucune clé n'est envoyée où que ce soit ; le mot de passe n'est jamais stocké, seule une clé qu'il permet de dériver l'est.
- **`src/lib/mockDb.ts`** — la « base de données » de l'application : un wrapper autour du coffre chiffré ci-dessus et de `localStorage`. Toutes les opérations CRUD (`insert`, `update`, `delete`, `getAll`) lisent/écrivent uniquement en local.
- **`src/lib/photoDb.ts`** — stockage des photos optionnelles dans IndexedDB, jamais uploadées.
- **`src/lib/exportData.ts`** — génération des exports CSV/JSON : construits en mémoire et téléchargés via un `Blob` local, jamais envoyés à un serveur.
- **`src/contexts/AuthContext.tsx`** — l'« authentification » : un profil local identifié par un e-mail non vérifié, un mot de passe qui déverrouille le coffre ci-dessus. Aucun appel réseau, aucune vérification serveur.
- **`vercel.json`** — la Content-Security-Policy déployée (`connect-src 'self'`) : même si un script malveillant était injecté, le navigateur bloquerait tout appel réseau sortant.

## Comment vérifier par vous-même

Cherchez, dans ces fichiers, `fetch(`, `XMLHttpRequest`, `axios`, `WebSocket`, `EventSource` : vous n'en trouverez aucun. C'est exactement la vérification faite dans [`docs/TECHNICAL_DATA_FLOW_AUDIT.md`](../docs/TECHNICAL_DATA_FLOW_AUDIT.md), reproductible ici sur du code source réel plutôt que sur un rapport.

## Portée

Cet extrait date du commit correspondant au dépôt privé au moment de la publication. Il peut ne pas refléter les toutes dernières modifications. Pour un accès en lecture au dépôt complet et à jour, voir le contact en page d'accueil de ce dépôt.
