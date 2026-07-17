# Sauvegardes chiffrées

L’export JSON historique reste disponible pour compatibilité, mais il est lisible par toute personne qui obtient le fichier. Pour une sauvegarde contenant des données de santé, utiliser `encryptBackupJSON` avec un mot de passe distinct du mot de passe du profil, puis conserver le fichier et le mot de passe séparément.

Le format chiffré utilise AES-GCM 256 bits avec une clé dérivée par PBKDF2-SHA-256 (600 000 itérations) et un sel/nonce aléatoires par export. Une mauvaise clé ou un fichier modifié est rejeté. L’application ne conserve pas le mot de passe d’export et ne peut pas le réinitialiser.
