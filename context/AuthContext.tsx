import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { blink } from '@/lib/blink';
import type { AuthUser, User } from '@/types';

// ─── Storage Key ──────────────────────────────────────────────────────────────

const AUTH_STORAGE_KEY = '@piaget:auth_user';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Re-hydrate from AsyncStorage on app start
  useEffect(() => {
    const rehydrate = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (raw) {
          const parsed: AuthUser = JSON.parse(raw);
          setUser(parsed);
        }
      } catch {
        // Silently ignore storage read errors
      } finally {
        setIsLoading(false);
      }
    };

    rehydrate();
  }, []);

  /**
   * Login with either email or matricule + plain-text password.
   * Strategy: fetch user by email or matricule, then verify password client-side.
   */
  const login = useCallback(
    async (identifier: string, password: string) => {
      setIsLoading(true);
      try {
        const trimmedLower = identifier.trim().toLowerCase();
        const trimmedUpper = identifier.trim().toUpperCase();

        // Try matching by email first
        let matchedUsers: User[] = [];
        try {
          const byEmail = await blink.db.users.list({
            where: { email: trimmedLower },
            limit: 1,
          });
          matchedUsers = byEmail as User[];
        } catch {
          // Ignore query errors, try next method
        }

        // If no match by email, try by matricule
        if (matchedUsers.length === 0) {
          try {
            const byMatricule = await blink.db.users.list({
              where: { matricule: trimmedUpper },
              limit: 1,
            });
            matchedUsers = byMatricule as User[];
          } catch {
            // Ignore query errors
          }
        }

        if (matchedUsers.length === 0) {
          throw new Error('Identifiant ou mot de passe incorrect.');
        }

        const dbUser = matchedUsers[0];

        // Verify password client-side
        if (dbUser.passwordHash !== password) {
          throw new Error('Identifiant ou mot de passe incorrect.');
        }

        // Check if user is active
        if (Number(dbUser.isActive) === 0) {
          throw new Error('Ce compte est désactivé. Contactez l\'administrateur.');
        }

        const authUser: AuthUser = {
          id: dbUser.id,
          email: dbUser.email,
          matricule: dbUser.matricule,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          role: dbUser.role,
          classId: dbUser.classId,
        };

        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
        setUser(authUser);
      } catch (e: any) {
        setIsLoading(false);
        throw e;
      }
      setIsLoading(false);
    },
    []
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: user !== null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
