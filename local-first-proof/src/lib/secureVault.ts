import type { MockTableName, MockTableRecord } from './mockDb';

const DB_NAME = 'crohn_companion_secure_vault';
const DB_VERSION = 2;
const STORE_NAME = 'vaults';
const KDF_ITERATIONS = 600_000;

export type VaultTables = { [K in MockTableName]: MockTableRecord[K][] };

export type VaultPayload = {
  version: 1;
  tables: VaultTables;
  settings: Record<string, unknown>;
};

type VaultKeyEnvelope = {
  version: 1;
  iv: ArrayBuffer;
  wrappedKey: ArrayBuffer;
};

type StoredVault = {
  userId: string;
  iv: ArrayBuffer;
  ciphertext: ArrayBuffer;
  updatedAt: string;
  keyEnvelope?: VaultKeyEnvelope;
  fallbackKeyEnvelope?: VaultKeyEnvelope;
  rotationId?: string;
};

export type UnlockedVault = {
  key: CryptoKey;
  payload: VaultPayload | null;
};

export type VaultPasswordRotation = {
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
};

const emptyTables = (): VaultTables => ({
  medication_schedule: [],
  medications: [],
  profiles: [],
  stools: [],
  symptoms: [],
  hbi_scores: [],
});

export const createEmptyVault = (): VaultPayload => ({
  version: 1,
  tables: emptyTables(),
  settings: {},
});

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error ?? new Error('Impossible d’ouvrir le coffre local.'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });

  return dbPromise;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function createEncryptionSalt(): string {
  return toBase64(randomBytes(16));
}

/** Legacy/password-derived key helper retained for backups and vault migration. */
export async function deriveVaultKey(password: string, encodedSalt: string): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(encodedSalt),
      iterations: KDF_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt'],
  );
}

async function deriveWrappingKey(password: string, encodedSalt: string): Promise<CryptoKey> {
  const decodedSalt = fromBase64(encodedSalt);
  const domain = new TextEncoder().encode('crohn-companion-key-envelope-v1');
  const salt = new Uint8Array(decodedSalt.length + domain.length);
  salt.set(decodedSalt);
  salt.set(domain, decodedSalt.length);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: KDF_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function createDataKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

async function wrapDataKey(key: CryptoKey, password: string, encodedSalt: string): Promise<VaultKeyEnvelope> {
  const wrappingKey = await deriveWrappingKey(password, encodedSalt);
  const iv = randomBytes(12);
  const rawKey = await crypto.subtle.exportKey('raw', key);
  const wrappedKey = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, wrappingKey, rawKey);
  return { version: 1, iv: iv.buffer.slice(0), wrappedKey };
}

async function unwrapDataKey(
  envelope: VaultKeyEnvelope,
  password: string,
  encodedSalt: string,
): Promise<CryptoKey> {
  if (envelope.version !== 1) throw new Error('Le format de la clé locale est invalide.');
  const wrappingKey = await deriveWrappingKey(password, encodedSalt);
  const rawKey = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(envelope.iv) },
    wrappingKey,
    envelope.wrappedKey,
  );
  return crypto.subtle.importKey('raw', rawKey, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

async function getStoredVault(userId: string): Promise<StoredVault | undefined> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(userId);
    request.onerror = () => reject(request.error ?? new Error('Impossible de lire le coffre local.'));
    request.onsuccess = () => resolve(request.result as StoredVault | undefined);
  });
}

async function putStoredVault(record: StoredVault): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const request = transaction.objectStore(STORE_NAME).put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(
      transaction.error ?? request.error ?? new Error('Impossible d’enregistrer le coffre local.'),
    );
    transaction.onabort = () => reject(transaction.error ?? new Error('Enregistrement du coffre local annulé.'));
  });
}

function parseVaultPayload(plaintext: ArrayBuffer): VaultPayload {
  const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<VaultPayload>;
  if (parsed.version !== 1 || !parsed.tables || !parsed.settings) {
    throw new Error('Le format du coffre local est invalide.');
  }
  return {
    version: 1,
    tables: { ...emptyTables(), ...parsed.tables },
    settings: parsed.settings,
  };
}

async function decryptStoredVault(record: StoredVault, key: CryptoKey): Promise<VaultPayload> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(record.iv) },
    key,
    record.ciphertext,
  );
  return parseVaultPayload(plaintext);
}

/**
 * Opens a vault through its password-protected data-key envelope. Legacy vaults
 * retain their exact former key, which also keeps separately stored photos readable.
 */
export async function unlockVault(
  userId: string,
  password: string,
  encodedSalt: string,
): Promise<UnlockedVault> {
  const record = await getStoredVault(userId);
  if (!record) return { key: await createDataKey(), payload: null };

  if (!record.keyEnvelope) {
    const legacyKey = await deriveVaultKey(password, encodedSalt);
    const payload = await decryptStoredVault(record, legacyKey);
    const keyEnvelope = await wrapDataKey(legacyKey, password, encodedSalt);
    await putStoredVault({ ...record, keyEnvelope });
    return { key: legacyKey, payload };
  }

  const candidates = [record.keyEnvelope, record.fallbackKeyEnvelope].filter(Boolean) as VaultKeyEnvelope[];
  let key: CryptoKey | null = null;
  let selectedEnvelope: VaultKeyEnvelope | null = null;
  let payload: VaultPayload | null = null;
  for (const envelope of candidates) {
    try {
      const candidateKey = await unwrapDataKey(envelope, password, encodedSalt);
      const candidatePayload = await decryptStoredVault(record, candidateKey);
      key = candidateKey;
      selectedEnvelope = envelope;
      payload = candidatePayload;
      break;
    } catch {
      // Try the recovery envelope left by an interrupted password change.
    }
  }
  if (!key || !selectedEnvelope || !payload) {
    throw new Error('Mot de passe incorrect ou coffre local corrompu.');
  }

  if (record.fallbackKeyEnvelope) {
    await putStoredVault({
      ...record,
      keyEnvelope: selectedEnvelope,
      fallbackKeyEnvelope: undefined,
      rotationId: undefined,
    });
  }
  return { key, payload };
}

export async function saveVault(
  userId: string,
  key: CryptoKey,
  payload: VaultPayload,
  credentials?: { password: string; encodedSalt: string },
): Promise<void> {
  const iv = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  const current = await getStoredVault(userId);
  const keyEnvelope = current?.keyEnvelope ?? (credentials
    ? await wrapDataKey(key, credentials.password, credentials.encodedSalt)
    : undefined);
  await putStoredVault({
    userId,
    iv: iv.buffer.slice(0),
    ciphertext,
    updatedAt: new Date().toISOString(),
    keyEnvelope,
    fallbackKeyEnvelope: current?.fallbackKeyEnvelope,
    rotationId: current?.rotationId,
  });
}

export async function loadVault(userId: string, key: CryptoKey): Promise<VaultPayload | null> {
  const record = await getStoredVault(userId);
  if (!record) return null;
  return decryptStoredVault(record, key);
}

/** Starts a two-phase password change while the stable data key stays unchanged. */
export async function beginVaultPasswordRotation(
  userId: string,
  key: CryptoKey,
  payload: VaultPayload,
  password: string,
  encodedSalt: string,
): Promise<VaultPasswordRotation> {
  const current = await getStoredVault(userId);
  if (!current?.keyEnvelope) throw new Error('Le coffre local ne peut pas être rechiffré.');
  const rotationId = crypto.randomUUID();
  const nextEnvelope = await wrapDataKey(key, password, encodedSalt);
  const iv = randomBytes(12);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  await putStoredVault({
    userId,
    iv: iv.buffer.slice(0),
    ciphertext,
    updatedAt: new Date().toISOString(),
    keyEnvelope: nextEnvelope,
    fallbackKeyEnvelope: current.keyEnvelope,
    rotationId,
  });

  const updateRotation = async (mode: 'commit' | 'rollback') => {
    const pending = await getStoredVault(userId);
    if (!pending || pending.rotationId !== rotationId) return;
    const selected = mode === 'rollback' ? pending.fallbackKeyEnvelope : pending.keyEnvelope;
    if (!selected) throw new Error('La restauration de l’ancien mot de passe est impossible.');
    await putStoredVault({
      ...pending,
      keyEnvelope: selected,
      fallbackKeyEnvelope: undefined,
      rotationId: undefined,
    });
  };

  return {
    commit: () => updateRotation('commit'),
    rollback: () => updateRotation('rollback'),
  };
}

/** Reports whether an encrypted vault container still exists for this profile (wipe verification). */
export async function hasStoredVault(userId: string): Promise<boolean> {
  return (await getStoredVault(userId)) !== undefined;
}

export async function deleteVault(userId: string): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).delete(userId);
    request.onerror = () => reject(request.error ?? new Error('Impossible de supprimer le coffre local.'));
    request.onsuccess = () => resolve();
  });
}
