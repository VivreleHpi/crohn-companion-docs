// Local-first encrypted vault. The legacy name is kept temporarily so existing
// UI code can migrate without a risky, all-at-once rewrite.
import {
  beginVaultPasswordRotation,
  createEmptyVault,
  saveVault,
  unlockVault,
  type VaultPayload,
  type VaultPasswordRotation,
} from './secureVault';

export interface MockProfile {
  id: string;
  username: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  medical_info?: string;
  user_id?: string;
  disease_type?: string;
  diagnosis_year?: number;
  avatar_url?: string;
  weight_kg?: number;
  height_cm?: number;
  doctor_name?: string;
  doctor_email?: string;
  blood_type?: string;
  other_conditions?: string;
  date_of_birth?: string;
  medical_record_number?: string;
  medical_history?: string;
}

export interface MockStool {
  id: string;
  user_id: string;
  bristol_type: number;
  time: string;
  has_blood: boolean;
  has_mucus: boolean;
  notes: string | null;
  created_at?: string;
}

export interface MockSymptom {
  id: string;
  user_id: string;
  symptom?: string;
  name?: string;
  severity: number;
  time: string;
  notes: string | null;
  created_at?: string;
}

export interface MockMedication {
  id: string;
  user_id: string;
  name: string;
  dosage: string;
  frequency: string;
  time?: string;
  status?: string;
  treatment_type?: 'background' | 'symptomatic' | 'short_course' | 'supplement' | string;
  start_date?: string;
  end_date?: string;
  stop_reason?: string;
  side_effects?: string[];
  notes?: string;
  created_at?: string;
}

export interface MockMedicationSchedule {
  id: string;
  user_id: string;
  medication_id: string;
  scheduled_date: string; // YYYY-MM-DD
  scheduled_time?: string; // HH:MM
  time?: string; // Legacy compatibility for older local records
  taken: boolean;
  taken_at: string | null;
  /** True uniquement quand l'utilisateur a explicitement déclaré un oubli. */
  missed_declared?: boolean;
  missed_reason?: string;
  symptoms_after_missed?: string;
  patient_comment?: string;
  side_effects?: string[];
  created_at?: string;
  medication?: MockMedication; // Joined relation
}

export interface MockHbiScore {
  id: string;
  user_id?: string;
  date: string;
  score: number;
  category: string;
}

export type MockTableName = 'medication_schedule' | 'medications' | 'profiles' | 'stools' | 'symptoms' | 'hbi_scores';

export type MockTableRecord = {
  medication_schedule: MockMedicationSchedule;
  medications: MockMedication;
  profiles: MockProfile;
  stools: MockStool;
  symptoms: MockSymptom;
  hbi_scores: MockHbiScore;
};

export type MockEntity = MockTableRecord[MockTableName];

type VaultSession = {
  userId: string;
  key: CryptoKey;
  payload: VaultPayload;
};

let vaultSession: VaultSession | null = null;
let persistQueue: Promise<void> = Promise.resolve();

const readLegacyRows = <T extends { id?: string; user_id?: string }>(tableName: MockTableName, userId: string): T[] => {
  try {
    const raw = localStorage.getItem(`crohn_${tableName}`);
    const rows = raw ? JSON.parse(raw) as T[] : [];
    return rows.filter((row) => tableName === 'profiles' ? row.id === userId : row.user_id === userId);
  } catch {
    return [];
  }
};

const removeLegacyRowsForUser = (tableName: MockTableName, userId: string) => {
  try {
    const raw = localStorage.getItem(`crohn_${tableName}`);
    const rows = raw ? JSON.parse(raw) as Array<{ id?: string; user_id?: string }> : [];
    const remaining = rows.filter((row) => tableName === 'profiles' ? row.id !== userId : row.user_id !== userId);
    if (remaining.length === 0) localStorage.removeItem(`crohn_${tableName}`);
    else localStorage.setItem(`crohn_${tableName}`, JSON.stringify(remaining));
  } catch {
    // A malformed legacy value is left untouched rather than risking deletion.
  }
};

const migrateLegacyPayload = (userId: string): VaultPayload => {
  let appointments: unknown[] = [];
  try {
    const users = JSON.parse(localStorage.getItem('crohn_local_users') || '[]') as Array<{ id?: string }>;
    // Legacy appointments did not carry an owner. Migrating them is safe only for a single-profile browser.
    if (users.length === 1 && users[0]?.id === userId) appointments = JSON.parse(localStorage.getItem('crohn_appointments') || '[]');
  } catch {
    // Keep ambiguous or malformed legacy appointments untouched rather than risking a cross-profile migration.
  }
  return {
    version: 1,
    tables: {
      medication_schedule: readLegacyRows<MockMedicationSchedule>('medication_schedule', userId),
      medications: readLegacyRows<MockMedication>('medications', userId),
      profiles: readLegacyRows<MockProfile>('profiles', userId),
      stools: readLegacyRows<MockStool>('stools', userId),
      symptoms: readLegacyRows<MockSymptom>('symptoms', userId),
      hbi_scores: readLegacyRows<MockHbiScore>('hbi_scores', userId),
    },
    settings: appointments.length > 0 ? { appointments } : {},
  };
};

const persistCurrentVault = () => {
  if (!vaultSession) return;
  const snapshot = structuredClone(vaultSession.payload);
  const { userId, key } = vaultSession;
  persistQueue = persistQueue
    .catch(() => undefined)
    .then(() => saveVault(userId, key, snapshot));
  void persistQueue.catch((error) => console.error('[vault] Enregistrement local impossible:', error));
};

export async function unlockMockDb(userId: string, password: string, encryptionSalt: string): Promise<void> {
  const unlocked = await unlockVault(userId, password, encryptionSalt);
  const { key } = unlocked;
  let { payload } = unlocked;
  if (!payload) {
    payload = migrateLegacyPayload(userId);
    await saveVault(userId, key, payload, { password, encodedSalt: encryptionSalt });
    (Object.keys(payload.tables) as MockTableName[]).forEach((tableName) => removeLegacyRowsForUser(tableName, userId));
    if (payload.settings.appointments) localStorage.removeItem('crohn_appointments');
  }
  vaultSession = { userId, key, payload };
}

export function lockMockDb(): void {
  vaultSession = null;
}

export async function flushMockDb(): Promise<void> {
  await persistQueue;
}

/** Re-wraps the stable data key without re-encrypting each separately stored photo. */
export async function rotateMockDbKey(
  password: string,
  encryptionSalt: string,
): Promise<VaultPasswordRotation> {
  if (!vaultSession) throw new Error('Coffre local verrouillé.');

  // Finish every pending write before starting the recoverable envelope change.
  await flushMockDb();
  return beginVaultPasswordRotation(
    vaultSession.userId,
    vaultSession.key,
    vaultSession.payload,
    password,
    encryptionSalt,
  );
}

export function getMockDbUserId(): string | null {
  return vaultSession?.userId ?? null;
}

export async function encryptWithVaultKey(bytes: ArrayBuffer): Promise<{ iv: ArrayBuffer; ciphertext: ArrayBuffer }> {
  if (!vaultSession) throw new Error('Coffre local verrouillé.');
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, vaultSession.key, bytes);
  return { iv: iv.buffer.slice(0), ciphertext };
}

export async function decryptWithVaultKey(ciphertext: ArrayBuffer, iv: ArrayBuffer): Promise<ArrayBuffer> {
  if (!vaultSession) throw new Error('Coffre local verrouillé.');
  return crypto.subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(iv) }, vaultSession.key, ciphertext);
}

export function getVaultSetting<T>(key: string, fallback: T): T {
  if (!vaultSession) return fallback;
  return (vaultSession.payload.settings[key] as T | undefined) ?? fallback;
}

export function setVaultSetting<T>(key: string, value: T): void {
  if (!vaultSession) return;
  vaultSession.payload.settings[key] = value;
  persistCurrentVault();
}

export function clearVaultSettings(): void {
  if (!vaultSession) return;
  vaultSession.payload.settings = {};
  persistCurrentVault();
}

export function replaceMockDbSnapshot(tables: VaultPayload['tables'], settings: Record<string, unknown>): void {
  if (!vaultSession) throw new Error('Coffre local verrouillé.');
  vaultSession.payload = {
    version: 1,
    tables: structuredClone(tables),
    settings: structuredClone(settings),
  };
  persistCurrentVault();
  (Object.keys(tables) as MockTableName[]).forEach((tableName) => {
    window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`));
  });
}

export function eraseCurrentMockDb(): void {
  if (!vaultSession) return;
  vaultSession.payload = createEmptyVault();
  persistCurrentVault();
  (['medication_schedule', 'medications', 'profiles', 'stools', 'symptoms', 'hbi_scores'] as MockTableName[])
    .forEach((tableName) => window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`)));
}

// Compatibility no-op: callers can keep invoking it while storage is now
// initialized explicitly at unlock time.
export const initMockDb = () => undefined;

// Generic CRUD operations helper for LocalStorage
export const mockDb = {
  getTable: <T>(tableName: MockTableName): T[] => {
    const data = vaultSession?.payload.tables[tableName] ?? [];
    return structuredClone(data) as T[];
  },

  setTable: <T>(tableName: MockTableName, data: T[]): void => {
    if (!vaultSession) return;
    vaultSession.payload.tables[tableName] = structuredClone(data) as VaultPayload['tables'][MockTableName];
    persistCurrentVault();
  },

  getAll: <T>(tableName: MockTableName): T[] => {
    return mockDb.getTable<T>(tableName);
  },

  getById: <T extends { id?: string }>(tableName: MockTableName, id: string): T | null => {
    const table = mockDb.getTable<T>(tableName);
    return table.find(item => item.id === id) || null;
  },

  insert: <T extends { id?: string; created_at?: string }>(tableName: MockTableName, item: T): T => {
    if (!vaultSession) throw new Error('Coffre local verrouillé.');
    const table = mockDb.getTable<T>(tableName);
    const newItem = {
      ...item,
      id: item.id || `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      created_at: item.created_at || new Date().toISOString()
    };
    table.unshift(newItem); // New items at the beginning
    mockDb.setTable(tableName, table);
    
    // Dispatch custom event for local reactive updates (simulate realtime)
    window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`));
    return newItem;
  },

  update: <T extends { id?: string }>(tableName: MockTableName, id: string, updates: Partial<T>): T | null => {
    if (!vaultSession) throw new Error('Coffre local verrouillé.');
    const table = mockDb.getTable<T>(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return null;

    const updatedItem = { ...table[index], ...updates };
    table[index] = updatedItem;
    mockDb.setTable(tableName, table);
    
    window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`));
    return updatedItem;
  },

  delete: (tableName: MockTableName, id: string): boolean => {
    if (!vaultSession) throw new Error('Coffre local verrouillé.');
    const table = mockDb.getTable<{ id?: string }>(tableName);
    const filteredTable = table.filter(item => item.id !== id);
    if (table.length === filteredTable.length) return false;
    
    mockDb.setTable(tableName, filteredTable);
    window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`));
    return true;
  },

  clear: (tableName: MockTableName): void => {
    if (!vaultSession) return;
    mockDb.setTable(tableName, []);
    window.dispatchEvent(new CustomEvent(`mock-db-${tableName}-changed`));
  }
};
