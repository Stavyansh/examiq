/**
 * Authentication Service
 * Phase 5: User authentication and session management
 * Uses shared mock database from @/lib/db
 */

import { findUserByEmail, findUserById, createUser as dbCreateUser, createSession as dbCreateSession, deleteSession as dbDeleteSession, getSessionUser, hashPassword } from '@/lib/db';
import type { User } from '@/lib/db';

// Re-export User type for consumers
export type { User } from '@/lib/db';

export type PublicUser = Omit<User, 'passwordHash'>;
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  notifications?: boolean;
  emailUpdates?: boolean;
}
export interface UserWithPreferences extends PublicUser {
  preferences?: UserPreferences;
}

export const AUTH_CONFIG = {
  sessionDurationHours: 24 * 30,
  cookieName: 'examiq_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  }
};

export async function createSession(userId: string): Promise<string> {
  const session = await dbCreateSession(userId);
  return session.token;
}

export async function validateSession(sessionToken: string): Promise<{ userId: string } | null> {
  const user = await getSessionUser(sessionToken);
  if (!user) return null;
  return { userId: user.id };
}

export async function deleteSession(sessionToken: string): Promise<void> {
  await dbDeleteSession(sessionToken);
}

export async function getUserById(userId: string): Promise<User | null> {
  return await findUserById(userId);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return await findUserByEmail(email);
}

export async function createUser(userData: {
  email: string;
  name: string;
  password: string;
  role?: string;
}): Promise<PublicUser> {
  try {
    const user = await dbCreateUser({
      email: userData.email,
      name: userData.name,
      password: userData.password,
    });
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('already exists')) {
      throw new Error('User with this email already exists');
    }
    throw error;
  }
}

export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserWithPreferences> {
  const user = await getUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }
  const current = user as UserWithPreferences;
  return { ...current, preferences: { ...(current.preferences ?? {}), ...preferences } };
}

export async function authenticateUser(email: string, password: string): Promise<
  | { user: PublicUser; sessionToken: string }
  | { error: string }
> {
  const user = await getUserByEmail(email);
  if (!user) {
    return { error: 'Invalid email or password' };
  }

  if (hashPassword(password) !== user.passwordHash) {
    return { error: 'Invalid email or password' };
  }

  const sessionToken = await createSession(user.id);
  const { passwordHash, ...userWithoutPassword } = user;
  return {
    user: userWithoutPassword,
    sessionToken
  };
}

export function authorizeRole(_user: User, _requiredRole: string | string[]): boolean {
  return true;
}
