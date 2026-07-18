import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createEncryptionSalt } from '@/lib/secureVault';
import { flushMockDb, lockMockDb, mockDb, rotateMockDbKey, setVaultSetting, unlockMockDb } from '@/lib/mockDb';
import { createDemoUser, DEMO_USER_ID, seedDemoClinicalData } from '@/lib/demoData';
import { localDateKey } from '@/lib/time';
import { clearFailedLogins, getLoginDelayMs, recordFailedLogin } from '@/lib/authRateLimit';
import { purgeDemoPhotos } from '@/lib/photoDb';

export interface LocalUser {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

type LocalSession = {
  access_token: string;
  user: LocalUser;
};

type LocalStoredUser = LocalUser & {
  password?: string;
  password_hash?: string;
  password_salt?: string;
  encryption_salt?: string;
};

type AuthContextType = {
  user: LocalUser | null;
  session: LocalSession | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInDemo: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

const PASSWORD_KDF_ITERATIONS = 600_000;

const createSalt = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
};

const legacyHashPassword = async (password: string, salt: string) => {
  const payload = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', payload);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
};

const hashPassword = async (password: string, salt: string) => {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: new TextEncoder().encode(salt),
    iterations: PASSWORD_KDF_ITERATIONS,
    hash: 'SHA-256',
  }, material, 256);
  return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2, '0')).join('');
};

const createPasswordRecord = async (password: string) => {
  const salt = createSalt();
  return { password_hash: await hashPassword(password, salt), password_salt: salt };
};

const toSessionUser = (stored: LocalStoredUser): LocalUser => ({
  id: stored.id,
  email: stored.email,
  username: stored.username,
  created_at: stored.created_at,
});

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [session, setSession] = useState<LocalSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // A browser session is only a convenience marker. Real encrypted health
    // vaults are never reopened until the user provides their secret again.
    // The public demo contains fictional data and may persist for evaluator UX.
    const restoreDemo = async () => {
      const expiresAt = Date.parse(localStorage.getItem('crohn_demo_expires_at') || '');
      if (localStorage.getItem('crohn_demo_session') !== 'true' || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        localStorage.removeItem('crohn_demo_session');
        localStorage.removeItem('crohn_demo_expires_at');
        await purgeDemoPhotos().catch((error) => console.error('[demo] Purge des photos impossible:', error));
        lockMockDb();
        setLoading(false);
        return;
      }
      try {
        const demoUser = createDemoUser();
        await purgeDemoPhotos();
        await unlockMockDb(demoUser.id, 'crohn-companion-demo-vault-v1', 'Y3JvaG4tZGVtby12YXVsdC0x');
        seedDemoClinicalData(demoUser);
        setVaultSetting('crisis_dismissed_day', localDateKey());
        await flushMockDb();
        setUser(demoUser);
        setSession({ access_token: 'local-demo-vault', user: demoUser });
      } catch {
        localStorage.removeItem('crohn_demo_session');
        localStorage.removeItem('crohn_demo_expires_at');
        lockMockDb();
      } finally {
        setLoading(false);
      }
    };
    void restoreDemo();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      const users = JSON.parse(localStorage.getItem('crohn_local_users') || '[]') as LocalStoredUser[];
      const foundUser = users.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());
      if (!foundUser || !foundUser.password_hash || !foundUser.password_salt) {
        throw new Error('Identifiants invalides.');
      }
      const delay = getLoginDelayMs(foundUser.id);
      if (delay > 0) {
        const seconds = Math.ceil(delay / 1_000);
        throw new Error(`Trop de tentatives. Réessayez dans ${seconds} seconde${seconds > 1 ? 's' : ''}.`);
      }

      const modernHash = await hashPassword(password, foundUser.password_salt);
      const legacyHash = modernHash === foundUser.password_hash
        ? modernHash
        : await legacyHashPassword(password, foundUser.password_salt);
      if (modernHash !== foundUser.password_hash && legacyHash !== foundUser.password_hash) {
        recordFailedLogin(foundUser.id);
        throw new Error('Identifiants invalides.');
      }

      const encryptionSalt = foundUser.encryption_salt || createEncryptionSalt();
      const migratedUser: LocalStoredUser = {
        ...foundUser,
        password_hash: modernHash,
        encryption_salt: encryptionSalt,
      };
      localStorage.setItem('crohn_local_users', JSON.stringify(users.map((candidate) => (
        candidate.id === foundUser.id ? migratedUser : candidate
      ))));

      await unlockMockDb(foundUser.id, password, encryptionSalt);
      clearFailedLogins(foundUser.id);
      const sessionUser = toSessionUser(migratedUser);
      localStorage.setItem('crohn_local_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setSession({ access_token: 'local-vault-unlocked', user: sessionUser });
      toast({ title: 'Coffre local déverrouillé', description: 'Vos données restent chiffrées sur cet appareil.' });
    } catch (error: unknown) {
      lockMockDb();
      const message = error instanceof Error ? error.message : 'Impossible de déverrouiller le coffre local.';
      toast({ title: 'Connexion impossible', description: message, variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      if (password.length < 8) {
        throw new Error('Choisissez un mot de passe d’au moins 8 caractères pour protéger votre coffre local.');
      }
      const users = JSON.parse(localStorage.getItem('crohn_local_users') || '[]') as LocalStoredUser[];
      if (users.some((candidate) => candidate.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Cet email est déjà utilisé sur cet appareil.');
      }

      const id = crypto.randomUUID();
      const passwordRecord = await createPasswordRecord(password);
      const storedUser: LocalStoredUser = {
        id,
        email,
        username: email.split('@')[0],
        ...passwordRecord,
        encryption_salt: createEncryptionSalt(),
        created_at: new Date().toISOString(),
      };
      await unlockMockDb(id, password, storedUser.encryption_salt);
      mockDb.insert('profiles', {
        id,
        email,
        full_name: storedUser.username,
        phone_number: '',
        medical_info: '',
        user_id: id,
      });
      await flushMockDb();
      users.push(storedUser);
      localStorage.setItem('crohn_local_users', JSON.stringify(users));

      const sessionUser = toSessionUser(storedUser);
      localStorage.setItem('crohn_local_user', JSON.stringify(sessionUser));
      setUser(sessionUser);
      setSession({ access_token: 'local-vault-unlocked', user: sessionUser });
      toast({ title: 'Coffre local créé', description: 'Aucune donnée de santé n’est envoyée à un serveur.' });
    } catch (error: unknown) {
      lockMockDb();
      const message = error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du coffre.';
      toast({ title: 'Inscription impossible', description: message, variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signInDemo = async () => {
    try {
      setLoading(true);
      const demoUser = createDemoUser();
      await purgeDemoPhotos();
      await unlockMockDb(demoUser.id, 'crohn-companion-demo-vault-v1', 'Y3JvaG4tZGVtby12YXVsdC0x');
      seedDemoClinicalData(demoUser);
      setVaultSetting('crisis_dismissed_day', localDateKey());
      await flushMockDb();
      setUser(demoUser);
      setSession({ access_token: 'local-demo-vault', user: demoUser });
      localStorage.setItem('crohn_demo_session', 'true');
      toast({ title: 'Profil démo prêt', description: 'Les données affichées sont fictives.' });
    } catch (error: unknown) {
      lockMockDb();
      toast({ title: 'Erreur démo', description: 'Impossible de préparer le profil fictif.', variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      await flushMockDb();
      if (user?.id === DEMO_USER_ID) await purgeDemoPhotos();
    } finally {
      lockMockDb();
      localStorage.removeItem('crohn_local_user');
      localStorage.removeItem('crohn_demo_session');
      localStorage.removeItem('crohn_demo_expires_at');
      setUser(null);
      setSession(null);
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id !== DEMO_USER_ID) return;

    const expiresAt = Date.parse(localStorage.getItem('crohn_demo_expires_at') || '');
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      void signOut();
      return;
    }

    const timeout = window.setTimeout(() => void signOut(), expiresAt - Date.now());
    return () => window.clearTimeout(timeout);
  }, [user, signOut]);

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user || user.id === DEMO_USER_ID) {
      throw new Error('Le mot de passe du profil démo ne peut pas être modifié.');
    }
    if (newPassword.length < 8) {
      throw new Error('Choisissez un mot de passe d’au moins 8 caractères pour protéger votre coffre local.');
    }

    try {
      setLoading(true);
      const users = JSON.parse(localStorage.getItem('crohn_local_users') || '[]') as LocalStoredUser[];
      const storedUser = users.find((candidate) => candidate.id === user.id);
      if (!storedUser?.password_hash || !storedUser.password_salt) {
        throw new Error('Impossible de vérifier le mot de passe actuel.');
      }

      const modernHash = await hashPassword(currentPassword, storedUser.password_salt);
      const legacyHash = modernHash === storedUser.password_hash
        ? modernHash
        : await legacyHashPassword(currentPassword, storedUser.password_salt);
      if (modernHash !== storedUser.password_hash && legacyHash !== storedUser.password_hash) {
        throw new Error('Le mot de passe actuel est incorrect.');
      }

      const passwordRecord = await createPasswordRecord(newPassword);
      const encryptionSalt = createEncryptionSalt();
      const updatedUser: LocalStoredUser = { ...storedUser, ...passwordRecord, encryption_salt: encryptionSalt };
      const previousUsers = localStorage.getItem('crohn_local_users');
      const rotation = await rotateMockDbKey(newPassword, encryptionSalt);
      let credentialsUpdated = false;
      try {
        localStorage.setItem('crohn_local_users', JSON.stringify(users.map((candidate) => (
          candidate.id === user.id ? updatedUser : candidate
        ))));
        credentialsUpdated = true;
        await rotation.commit();
      } catch (rotationError) {
        if (credentialsUpdated) {
          if (previousUsers === null) localStorage.removeItem('crohn_local_users');
          else localStorage.setItem('crohn_local_users', previousUsers);
        }
        await rotation.rollback();
        throw rotationError;
      }
      toast({ title: 'Mot de passe modifié', description: 'Votre coffre local a été rechiffré avec ce nouveau mot de passe.' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.';
      toast({ title: 'Modification impossible', description: message, variant: 'destructive' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signInWithEmail, signInDemo, signUp, signOut, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé à l’intérieur d’un AuthProvider');
  return context;
};
