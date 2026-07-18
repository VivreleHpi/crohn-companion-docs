import { decryptWithVaultKey, encryptWithVaultKey, getMockDbUserId } from './mockDb';

export interface PhotoEntry {
  id: string;
  user_id: string;
  type: 'stool' | 'symptom' | 'skin' | 'other';
  blob: Blob;          // Original compressed binary image
  thumbnail: string;   // base64 thumbnail 100x100 for fast lists rendering
  notes: string;
  taken_at: string;    // ISO timestamp
  related_log_id?: string; // Relation to stool / symptom log
}

let dbInstance: IDBDatabase | null = null;
const DEMO_PHOTO_USER_ID = 'demo-local-evaluator';

function dispatchPhotosChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('crohn-photos-changed'));
}

/**
 * Medical metadata bundled and encrypted as a single AES-GCM block alongside
 * the image. Only `id` (IndexedDB key) and `user_id` (per-profile filtering
 * and deletion, even when the vault is locked) stay in plaintext.
 */
type SensitivePhotoMetadata = {
  type: PhotoEntry['type'];
  notes: string;
  taken_at: string;
  related_log_id?: string;
};

type StoredPhotoEntry = {
  id: string;
  user_id: string;
  encrypted_blob?: ArrayBuffer;
  blob_iv?: ArrayBuffer;
  encrypted_thumbnail?: ArrayBuffer;
  thumbnail_iv?: ArrayBuffer;
  encrypted_meta?: ArrayBuffer;
  meta_iv?: ArrayBuffer;
  // Temporary legacy fields (plaintext blob/thumbnail from v0, plaintext
  // metadata from v1) allow a controlled migration on first access. Some
  // storage backends return the image as raw bytes instead of a Blob.
  blob?: Blob | ArrayBuffer;
  thumbnail?: string;
  type?: PhotoEntry['type'];
  notes?: string;
  taken_at?: string;
  related_log_id?: string;
};

/**
 * Initializes IndexedDB crohn_photos database
 */
export function initPhotoDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open('crohn_photos', 2);

    request.onerror = () => {
      console.error('[photoDb] Error opening IndexedDB');
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('photos')) {
        const store = db.createObjectStore('photos', { keyPath: 'id' });
        // Create indexes for faster queries
        store.createIndex('by_user', 'user_id', { unique: false });
        store.createIndex('by_type', 'type', { unique: false });
        store.createIndex('by_date', 'taken_at', { unique: false });
      }
    };
  });
}

/**
 * Generates a base64 thumbnail (100x100 px) from an image file
 */
export function generateThumbnail(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = 100;
        canvas.height = 100;

        // Draw crop-centered square thumbnail
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;

        ctx.drawImage(img, sx, sy, size, size, 0, 0, 100, 100);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Compresses an image file (max 1200px side, 80% JPEG quality) and returns a Blob
 */
export function compressImage(file: File | Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        let width = img.width;
        let height = img.height;
        const maxSide = 1200;

        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas compression blob failed'));
          }
        }, 'image/jpeg', 0.8);
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Saves a new photo entry to IndexedDB
 */
export async function savePhoto(entry: Omit<PhotoEntry, 'blob' | 'thumbnail'> & { file: File }): Promise<PhotoEntry> {
  assertActivePhotoUser(entry.user_id);
  assertPhotoWritesAllowed(entry.user_id);
  const db = await initPhotoDb();
  
  // Compress and generate thumbnail concurrently
  const [compressedBlob, thumbnailBase64] = await Promise.all([
    compressImage(entry.file),
    generateThumbnail(entry.file)
  ]);

  const newEntry: PhotoEntry = {
    id: entry.id,
    user_id: entry.user_id,
    type: entry.type,
    blob: compressedBlob,
    thumbnail: thumbnailBase64,
    notes: entry.notes || '',
    taken_at: entry.taken_at,
    related_log_id: entry.related_log_id
  };
  const storedEntry = await toStoredPhoto(newEntry);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const lookup = store.get(storedEntry.id);

    lookup.onsuccess = () => {
      const existing = lookup.result as StoredPhotoEntry | undefined;
      if (existing && existing.user_id !== entry.user_id) {
        reject(new Error('Accès inter-profil refusé.'));
        return;
      }
      const request = store.put(storedEntry);

      request.onsuccess = () => {
        // Dispatch standard event for reactivity
        dispatchPhotosChanged();
        resolve(newEntry);
      };

      request.onerror = () => {
        console.error('[photoDb] Error saving entry:', request.error);
        reject(request.error);
      };
    };

    lookup.onerror = () => {
      reject(lookup.error);
    };
  });
}

/**
 * Retrieves all photos filterable by type
 */
export async function getPhotos(userId: string, filters?: { type?: 'stool' | 'symptom' | 'skin' | 'other'; daysLimit?: number }): Promise<PhotoEntry[]> {
  assertActivePhotoUser(userId);
  const db = await initPhotoDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();

    request.onsuccess = async () => {
      try {
      const stored = (request.result as StoredPhotoEntry[]).filter((photo) => photo.user_id === userId);
      let results = await Promise.all(stored.map(fromStoredPhoto));
      await migrateLegacyPhotos(db, stored);
      
      // Filter by type
      if (filters?.type) {
        results = results.filter(p => p.type === filters.type);
      }

      // Filter by date limit
      if (filters?.daysLimit) {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - filters.daysLimit);
        results = results.filter(p => new Date(p.taken_at).getTime() >= threshold.getTime());
      }

      // Sort descending by date
      results.sort((a, b) => new Date(b.taken_at).getTime() - new Date(a.taken_at).getTime());
      resolve(results);
      } catch (error) { reject(error); }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Retrieves a single photo by ID
 */
export async function getPhotoById(id: string, userId: string): Promise<PhotoEntry | null> {
  assertActivePhotoUser(userId);
  const db = await initPhotoDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.get(id);

    request.onsuccess = async () => {
      try {
        const photo = request.result as StoredPhotoEntry | undefined;
        if (!photo || photo.user_id !== userId) return resolve(null);
        const decrypted = await fromStoredPhoto(photo);
        await migrateLegacyPhotos(db, [photo]);
        resolve(decrypted);
      } catch (error) { reject(error); }
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Deletes a photo from IndexedDB
 */
export async function deletePhoto(id: string, userId: string): Promise<void> {
  assertActivePhotoUser(userId);
  const db = await initPhotoDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const lookup = store.get(id);

    lookup.onerror = () => reject(lookup.error);
    lookup.onsuccess = () => {
      const photo = lookup.result as StoredPhotoEntry | undefined;
      if (!photo || photo.user_id !== userId) {
        reject(new Error('Accès inter-profil refusé.'));
        return;
      }
      const request = store.delete(id);

      request.onsuccess = () => {
        dispatchPhotosChanged();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    };
  });
}

function assertActivePhotoUser(userId: string): void {
  if (!userId || getMockDbUserId() !== userId) throw new Error('Coffre local verrouillé ou accès inter-profil refusé.');
}

function assertPhotoWritesAllowed(userId: string): void {
  if (userId === DEMO_PHOTO_USER_ID) {
    throw new Error('Le profil démo est en lecture seule : utilisez les données fictives déjà fournies.');
  }
}

// `instanceof` fails on buffers returned from another realm (structured
// clone in workers or test harnesses), so binary payloads are detected by
// shape: ArrayBuffers expose byteLength, Blobs expose size.
function isRawBuffer(value: Blob | ArrayBuffer): value is ArrayBuffer {
  return typeof (value as ArrayBuffer).byteLength === 'number';
}

function toBlob(value: Blob | ArrayBuffer): Blob {
  return isRawBuffer(value) ? new Blob([new Uint8Array(value)], { type: 'image/jpeg' }) : value;
}

function readBlobBytes(blob: Blob | ArrayBuffer): Promise<ArrayBuffer> {
  if (isRawBuffer(blob)) return Promise.resolve(blob);
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Impossible de lire la photo.'));
    reader.readAsArrayBuffer(blob);
  });
}

async function toStoredPhoto(entry: PhotoEntry): Promise<StoredPhotoEntry> {
  const metadata: SensitivePhotoMetadata = {
    type: entry.type,
    notes: entry.notes,
    taken_at: entry.taken_at,
    related_log_id: entry.related_log_id,
  };
  const blobBytes = await readBlobBytes(entry.blob);
  const [blob, thumbnail, meta] = await Promise.all([
    encryptWithVaultKey(blobBytes),
    encryptWithVaultKey(new TextEncoder().encode(entry.thumbnail).buffer),
    encryptWithVaultKey(new TextEncoder().encode(JSON.stringify(metadata)).buffer),
  ]);
  return {
    id: entry.id,
    user_id: entry.user_id,
    encrypted_blob: blob.ciphertext,
    blob_iv: blob.iv,
    encrypted_thumbnail: thumbnail.ciphertext,
    thumbnail_iv: thumbnail.iv,
    encrypted_meta: meta.ciphertext,
    meta_iv: meta.iv,
  };
}

function readLegacyPlaintextMetadata(entry: StoredPhotoEntry): SensitivePhotoMetadata {
  if (!entry.type || !entry.taken_at) throw new Error('Photo chiffrée invalide.');
  return { type: entry.type, notes: entry.notes ?? '', taken_at: entry.taken_at, related_log_id: entry.related_log_id };
}

function parseSensitiveMetadata(bytes: ArrayBuffer): SensitivePhotoMetadata {
  const parsed = JSON.parse(new TextDecoder().decode(bytes)) as Partial<SensitivePhotoMetadata>;
  if (!parsed.type || typeof parsed.taken_at !== 'string') throw new Error('Photo chiffrée invalide.');
  return { type: parsed.type, notes: parsed.notes ?? '', taken_at: parsed.taken_at, related_log_id: parsed.related_log_id };
}

async function fromStoredPhoto(entry: StoredPhotoEntry): Promise<PhotoEntry> {
  if (entry.blob && entry.thumbnail !== undefined) {
    // v0 legacy record: everything still in plaintext.
    return { id: entry.id, user_id: entry.user_id, blob: toBlob(entry.blob), thumbnail: entry.thumbnail, ...readLegacyPlaintextMetadata(entry) };
  }
  if (!entry.encrypted_blob || !entry.blob_iv || !entry.encrypted_thumbnail || !entry.thumbnail_iv) throw new Error('Photo chiffrée invalide.');
  const [blobBytes, thumbnailBytes] = await Promise.all([decryptWithVaultKey(entry.encrypted_blob, entry.blob_iv), decryptWithVaultKey(entry.encrypted_thumbnail, entry.thumbnail_iv)]);
  const metadata = entry.encrypted_meta && entry.meta_iv
    ? parseSensitiveMetadata(await decryptWithVaultKey(entry.encrypted_meta, entry.meta_iv))
    // v1 legacy record: image encrypted but metadata still in plaintext.
    : readLegacyPlaintextMetadata(entry);
  return { id: entry.id, user_id: entry.user_id, ...metadata, blob: new Blob([blobBytes], { type: 'image/jpeg' }), thumbnail: new TextDecoder().decode(thumbnailBytes) };
}

function needsEncryptionMigration(entry: StoredPhotoEntry): boolean {
  return Boolean(entry.blob) || !entry.encrypted_meta || !entry.meta_iv;
}

async function migrateLegacyPhotos(db: IDBDatabase, entries: StoredPhotoEntry[]): Promise<void> {
  const legacy = entries.filter(needsEncryptionMigration);
  if (legacy.length === 0) return;
  const encrypted = await Promise.all(legacy.map(async (entry) => toStoredPhoto(await fromStoredPhoto(entry))));
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    encrypted.forEach((entry) => transaction.objectStore('photos').put(entry));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

/**
 * Deletes every clinical photo from IndexedDB.
 */
export async function clearAllPhotos(userId: string): Promise<void> {
  assertActivePhotoUser(userId);
  await deletePhotosForUser(userId);
}

async function deletePhotosForUser(userId: string): Promise<void> {
  const db = await initPhotoDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    const request = store.getAll();

    request.onsuccess = () => {
      const photos = request.result as StoredPhotoEntry[];
      photos.filter((photo) => photo.user_id === userId).forEach((photo) => store.delete(photo.id));
    };

    transaction.oncomplete = () => {
      dispatchPhotosChanged();
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/** Removes stale demo images even when an expired demo vault cannot unlock. */
export async function purgeDemoPhotos(): Promise<void> {
  await deletePhotosForUser(DEMO_PHOTO_USER_ID);
}

/**
 * Counts the stored photo records belonging to a profile without decrypting
 * them (the owner id stays in plaintext). Used to verify a full data wipe.
 */
export async function countPhotosForUser(userId: string): Promise<number> {
  const db = await initPhotoDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readonly');
    const store = transaction.objectStore('photos');
    const request = store.getAll();

    request.onsuccess = () => {
      const photos = request.result as StoredPhotoEntry[];
      resolve(photos.filter((photo) => photo.user_id === userId).length);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

/**
 * Imports already-normalized photo entries into IndexedDB.
 * Dispatches one gallery refresh event when the transaction completes.
 */
export async function importPhotoEntries(
  entries: PhotoEntry[],
  options: { clearExisting?: boolean; userId: string } = { userId: '' },
): Promise<void> {
  assertActivePhotoUser(options.userId);
  assertPhotoWritesAllowed(options.userId);
  const db = await initPhotoDb();
  const encryptedEntries = await Promise.all(entries.map((entry) => toStoredPhoto({ ...entry, user_id: options.userId })));

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['photos'], 'readwrite');
    const store = transaction.objectStore('photos');
    let conflict: Error | null = null;

    transaction.oncomplete = () => {
      dispatchPhotosChanged();
      resolve();
    };

    transaction.onerror = () => {
      reject(conflict ?? transaction.error);
    };

    transaction.onabort = () => {
      reject(conflict ?? transaction.error ?? new Error('Photo import transaction aborted'));
    };

    if (options.clearExisting) {
      const request = store.getAll();
      request.onsuccess = () => {
        (request.result as StoredPhotoEntry[])
          .filter((photo) => photo.user_id === options.userId)
          .forEach((photo) => store.delete(photo.id));
      };
    }

    encryptedEntries.forEach((entry) => {
      // Never silently overwrite a photo that belongs to another local
      // profile: the shared store is keyed by id only.
      const lookup = store.get(entry.id);
      lookup.onsuccess = () => {
        const existing = lookup.result as StoredPhotoEntry | undefined;
        if (existing && existing.user_id !== options.userId) {
          conflict = new Error('Import refusé : une photo d’un autre profil porte déjà cet identifiant.');
          transaction.abort();
          return;
        }
        store.put(entry);
      };
    });
  });
}
