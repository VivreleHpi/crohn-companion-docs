import {
  getMockDbUserId,
  getVaultSetting,
  mockDb,
  replaceMockDbSnapshot,
  type MockMedication,
  type MockMedicationSchedule,
  type MockStool,
  type MockSymptom,
  type MockTableRecord,
} from '@/lib/mockDb';
import { remapBackupId } from '@/lib/backupIdentity';
import { getMedicationEntryStateLabel } from '@/lib/medicationSchedule';
import { z } from 'zod';

type CsvCell = string | number | boolean | null | undefined;

const CSV_TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris';
const APPOINTMENTS_SETTING_KEY = 'appointments';

type StoredAppointment = {
  id: number;
  user_id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
  weight?: number | null;
};

type LocalBackupUser = {
  id: string;
  email?: string;
  username?: string;
};

export type ImportBackupMode = 'exact' | 'attach-to-current-user';

export type ImportBackupOptions = {
  mode?: ImportBackupMode;
  currentUser?: LocalBackupUser | null;
};

export type ImportBackupResult = {
  success: boolean;
  errors: string[];
  mode: ImportBackupMode;
  attachedUserId?: string;
};

function formatDateTimeForCSV(dateStr?: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

// CSV formatter helper
function convertToCSV(headers: string[], rows: CsvCell[][]): string {
  const csvRows = [headers.join(",")];
  for (const row of rows) {
    const escapedRow = row.map(val => {
      const stringified = val === null || val === undefined ? '' : String(val);
      // Neutralise l'interprétation de formules par Excel/LibreOffice pour les
      // champs libres issus des saisies utilisateur.
      const spreadsheetSafe = /^[=+\-@]/.test(stringified) ? `'${stringified}` : stringified;
      const escaped = spreadsheetSafe.replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(escapedRow.join(","));
  }
  return "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 compatibility
}

export function exportStoolsCSV(stools: MockStool[]): string {
  const headers = ["ID", "Date & Heure locale", "Fuseau", "Type Bristol", "Sang", "Mucus", "Notes"];
  const rows = stools.map(s => [
    s.id,
    formatDateTimeForCSV(s.time),
    CSV_TIMEZONE,
    s.bristol_type,
    s.has_blood ? 'Oui' : 'Non',
    s.has_mucus ? 'Oui' : 'Non',
    s.notes || ''
  ]);
  return convertToCSV(headers, rows);
}

export function exportSymptomsCSV(symptoms: MockSymptom[]): string {
  const headers = ["ID", "Date & Heure locale", "Fuseau", "Symptôme", "Intensité", "Notes"];
  const rows = symptoms.map(s => [
    s.id,
    formatDateTimeForCSV(s.time),
    CSV_TIMEZONE,
    s.name || s.symptom || 'Symptôme',
    s.severity,
    s.notes || ''
  ]);
  return convertToCSV(headers, rows);
}

export function exportMedicationsCSV(medications: MockMedication[], schedules: MockMedicationSchedule[]): string {
  const headers = ["ID prise", "Date prévue", "Heure", "Fuseau", "Médicament", "Dosage", "Type", "Statut", "Statut de saisie", "Date de prise locale", "Effets notés", "Raison de l'oubli", "Symptômes après oubli", "Commentaire patient"];
  const rows = schedules.map(s => {
    const med = medications.find(m => m.id === s.medication_id);
    return [
      s.id,
      s.scheduled_date,
      s.time,
      CSV_TIMEZONE,
      med ? med.name : 'Inconnu',
      med ? med.dosage : '',
      med ? med.treatment_type || 'background' : '',
      med ? med.status || 'active' : '',
      // Jamais « non pris » déduit d'une absence de saisie.
      getMedicationEntryStateLabel(s),
      formatDateTimeForCSV(s.taken_at),
      [...(med?.side_effects || []), ...(s.side_effects || [])].join(' | '),
      s.missed_reason || '',
      s.symptoms_after_missed || '',
      s.patient_comment || ''
    ];
  });
  return convertToCSV(headers, rows);
}

/**
 * Exports everything as a single JSON backup string
 */
export function exportFullBackupJSON(explicitUserId?: string): string {
  const activeUserId = explicitUserId ?? getMockDbUserId();
  const vaultUserId = getMockDbUserId();
  const ownRows = <T extends { id?: string; user_id?: string }>(rows: T[], profile = false): T[] => (
    activeUserId
      ? rows.filter((row) => {
          const owner = profile ? row.id : row.user_id;
          if (owner === activeUserId) return true;
          // Les lignes historiques sans propriétaire (anciens scores HBI…) ne
          // peuvent appartenir qu'au coffre déverrouillé : elles sont incluses
          // pour ne perdre aucune donnée, sans jamais exposer un autre profil.
          return owner === undefined && !profile && activeUserId === vaultUserId;
        })
      : []
  );
  const backup = {
    version: "2.1",
    exported_at: new Date().toISOString(),
    profiles: ownRows(mockDb.getAll('profiles'), true),
    stools: ownRows(mockDb.getAll('stools')),
    symptoms: ownRows(mockDb.getAll('symptoms')),
    medications: ownRows(mockDb.getAll('medications')),
    medication_schedule: ownRows(mockDb.getAll('medication_schedule')),
    hbi_scores: ownRows(mockDb.getAll('hbi_scores')),
    appointments: getVaultSetting<StoredAppointment[]>(APPOINTMENTS_SETTING_KEY, [])
      .filter((appointment) => appointment.user_id === activeUserId),
  };
  return JSON.stringify(backup, null, 2);
}

// Zod schemas for import validation. Every row schema uses `.passthrough()` so
// a valid backup never loses fields it carried (older or newer app versions,
// HBI sub-scores, created_at…) during an export → import round trip.
const backupValidationSchema = z.object({
  version: z.enum(['1.0', '2.0', '2.1']),
  exported_at: z.string(),
  profiles: z.array(z.object({
    id: z.string(),
    email: z.string(),
    username: z.string().optional(),
    full_name: z.string().optional(),
    phone_number: z.string().optional(),
    medical_info: z.string().optional(),
    user_id: z.string().optional(),
    avatar_url: z.string().optional(),
    weight_kg: z.number().optional(),
    height_cm: z.number().optional(),
    doctor_name: z.string().optional(),
    doctor_email: z.string().optional(),
    blood_type: z.string().optional(),
    other_conditions: z.string().optional(),
    date_of_birth: z.string().optional(),
    medical_record_number: z.string().optional(),
    disease_type: z.string().optional(),
    diagnosis_year: z.number().int().optional(),
    medical_history: z.string().optional(),
  }).passthrough()),
  stools: z.array(z.object({
    id: z.string(),
    bristol_type: z.number().int().min(1).max(7),
    has_blood: z.boolean(),
    has_mucus: z.boolean(),
    notes: z.string().nullable().optional(),
    time: z.string(),
    created_at: z.string().optional(),
    user_id: z.string()
  }).passthrough()),
  symptoms: z.array(z.object({
    id: z.string(),
    name: z.string().optional(),
    symptom: z.string().optional(),
    severity: z.number().int().min(1).max(4),
    notes: z.string().nullable().optional(),
    time: z.string(),
    created_at: z.string().optional(),
    user_id: z.string()
  }).passthrough()),
  medications: z.array(z.object({
    id: z.string(),
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    time: z.string().optional(),
    status: z.string().optional(),
    treatment_type: z.string().optional(),
    start_date: z.string().optional(),
    end_date: z.string().optional(),
    stop_reason: z.string().optional(),
    side_effects: z.array(z.string()).optional(),
    notes: z.string().optional(),
    created_at: z.string().optional(),
    user_id: z.string()
  }).passthrough()),
  medication_schedule: z.array(z.object({
    id: z.string(),
    medication_id: z.string(),
    time: z.string().optional(),
    scheduled_time: z.string().optional(),
    taken: z.boolean(),
    taken_at: z.string().optional().nullable(),
    missed_declared: z.boolean().optional(),
    missed_reason: z.string().optional(),
    symptoms_after_missed: z.string().optional(),
    patient_comment: z.string().optional(),
    side_effects: z.array(z.string()).optional(),
    scheduled_date: z.string(),
    created_at: z.string().optional(),
    user_id: z.string()
  }).passthrough()),
  hbi_scores: z.array(z.object({
    id: z.string(),
    date: z.string(),
    score: z.number(),
    category: z.string(),
    // Sous-scores du Harvey-Bradshaw : préservés explicitement à l'import.
    wellbeing: z.number().optional(),
    pain: z.number().optional(),
    stools_count: z.number().optional(),
    mass: z.number().optional(),
    complications_count: z.number().optional(),
    created_at: z.string().optional(),
    user_id: z.string().optional()
  }).passthrough()).optional().default([]),
  appointments: z.array(z.object({
    id: z.number(),
    user_id: z.string().optional(),
    title: z.string(),
    date: z.string(),
    time: z.string().optional(),
    location: z.string().optional().default(''),
    notes: z.string().optional().default(''),
    weight: z.number().nullable().optional().default(null)
  }).passthrough()).optional().default([])
});

type BackupData = z.infer<typeof backupValidationSchema>;

const DATA_CHANGED_EVENTS = [
  'mock-db-changed',
  'mock-db-stools-changed',
  'mock-db-symptoms-changed',
  'mock-db-medications-changed',
  'mock-db-medication_schedule-changed',
  'mock-db-hbi_scores-changed',
  'mock-db-profiles-changed',
  'crohn-appointments-changed',
];

function readCurrentLocalUser(): LocalBackupUser | null {
  try {
    const userStr = localStorage.getItem('crohn_local_user');
    if (!userStr) return null;

    const parsed = JSON.parse(userStr) as Partial<LocalBackupUser>;
    return typeof parsed.id === 'string' && parsed.id ? { ...parsed, id: parsed.id } : null;
  } catch (e) {
    console.error('[Import JSON] Erreur lecture utilisateur local:', e);
    return null;
  }
}

function dispatchImportEvents() {
  if (typeof window === 'undefined') return;
  DATA_CHANGED_EVENTS.forEach((eventName) => {
    window.dispatchEvent(new CustomEvent(eventName));
  });
}

/**
 * Rattache des lignes au profil cible. Les lignes provenant d'un autre profil
 * reçoivent un identifiant dérivé de façon déterministe (voir backupIdentity)
 * afin qu'aucune restauration ne puisse entrer en collision avec les données
 * d'un autre compte local, tout en gardant les liens entre tables cohérents.
 */
function attachRowsToUser<T extends { id: string; user_id?: string }>(rows: T[], userId: string): T[] {
  return rows.map((row) => ({
    ...row,
    id: row.user_id === userId ? row.id : remapBackupId(row.id, userId),
    user_id: userId,
  }));
}

function attachProfilesToCurrentUser(
  profiles: BackupData['profiles'],
  currentUser: LocalBackupUser,
): BackupData['profiles'] {
  const sourceProfile = profiles.find((profile) => profile.id === currentUser.id || profile.user_id === currentUser.id) ?? profiles[0];

  return [{
    ...(sourceProfile ?? {}),
    id: currentUser.id,
    email: currentUser.email || sourceProfile?.email || '',
    full_name: sourceProfile?.full_name || currentUser.username || '',
    user_id: currentUser.id,
  }];
}

function attachBackupToCurrentUser(data: BackupData, currentUser: LocalBackupUser): BackupData {
  const userId = currentUser.id;

  // Les identifiants de traitements sont remappés en premier pour que les
  // prises (medication_schedule) continuent de pointer vers le bon traitement.
  const medications = attachRowsToUser(data.medications, userId);
  const medicationIdMap = new Map(data.medications.map((medication, index) => [medication.id, medications[index].id]));

  return {
    ...data,
    profiles: attachProfilesToCurrentUser(data.profiles, currentUser),
    stools: attachRowsToUser(data.stools, userId),
    symptoms: attachRowsToUser(data.symptoms, userId),
    medications,
    medication_schedule: data.medication_schedule.map((schedule) => ({
      ...schedule,
      id: schedule.user_id === userId ? schedule.id : remapBackupId(schedule.id, userId),
      medication_id: medicationIdMap.get(schedule.medication_id)
        ?? (schedule.user_id === userId ? schedule.medication_id : remapBackupId(schedule.medication_id, userId)),
      user_id: userId,
    })),
    hbi_scores: attachRowsToUser(data.hbi_scores, userId),
    appointments: data.appointments.map((appointment) => ({ ...appointment, user_id: userId })),
  };
}

/**
 * Validates and imports data from backup JSON
 */
export function importFromBackupJSON(jsonStr: string, options: ImportBackupOptions = {}): ImportBackupResult {
  const mode = options.mode ?? 'exact';

  try {
    const parsed = JSON.parse(jsonStr);
    
    // Zod parsing/validation
    const validationResult = backupValidationSchema.safeParse(parsed);
    
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(
        err => `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors, mode };
    }

    const currentUser = options.currentUser ?? readCurrentLocalUser();
    if (mode === 'attach-to-current-user' && !currentUser) {
      return {
        success: false,
        errors: ["Aucun compte local connecte n'a ete trouve pour rattacher la sauvegarde."],
        mode,
      };
    }

    // An exact restore must never introduce another identity into the unlocked
    // vault. Restoring a backup for a different person is only possible via the
    // explicit attach mode, which rewrites every ownership field.
    if (mode === 'exact') {
      const activeUserId = getMockDbUserId();
      const backupProfileIds = validationResult.data.profiles.map((profile) => profile.id);
      if (!activeUserId || backupProfileIds.length !== 1 || backupProfileIds[0] !== activeUserId) {
        return { success: false, errors: ['La restauration exacte est limitée au profil actuellement déverrouillé.'], mode };
      }
    }

    const data = mode === 'attach-to-current-user' && currentUser
      ? attachBackupToCurrentUser(validationResult.data, currentUser)
      : validationResult.data;

    const tables: { [K in keyof MockTableRecord]: MockTableRecord[K][] } = {
      profiles: data.profiles,
      stools: data.stools,
      symptoms: data.symptoms,
      medications: data.medications,
      medication_schedule: data.medication_schedule,
      hbi_scores: data.hbi_scores,
    };
    // All validation happens before this single replacement. This prevents a
    // malformed import from leaving a half-restored clinical history behind.
    replaceMockDbSnapshot(tables, {
      [APPOINTMENTS_SETTING_KEY]: data.appointments as StoredAppointment[],
    });

    dispatchImportEvents();

    return { success: true, errors: [], mode, attachedUserId: mode === 'attach-to-current-user' ? currentUser?.id : undefined };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Erreur de format JSON invalide";
    return { success: false, errors: [message], mode };
  }
}
