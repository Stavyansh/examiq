/**
 * Authentication Middleware
 * Phase 5: Route protection and session validation
 */

import { cookies } from 'next/headers';
import { validateSession, getUserById, deleteSession, authorizeRole } from './services/authService';
import type { User } from './services/authService';

/**
 * Wrapper for server actions and route handlers that require authentication
 */
export async function withAuth<T>(
  handler: (user: User) => Promise<T>,
  options: { redirectTo?: string; roles?: string | string[] } = {}
): Promise<T> {
  const { redirectTo = '/login', roles } = options;
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('examiq_session')?.value;

  const session = await validateSession(sessionToken || '');
  if (!session) {
    throw new Error(`REDIRECT:${redirectTo}`);
  }

  const user = await getUserById(session.userId);
  if (!user) {
    await deleteSession(sessionToken || '');
    throw new Error(`REDIRECT:${redirectTo}`);
  }

  if (roles && !authorizeRole(user, roles)) {
    throw new Error('REDIRECT:/unauthorized');
  }

  return handler(user);
}

export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('examiq_session')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await validateSession(sessionToken);
  if (!session) {
    return null;
  }

  return await getUserById(session.userId);
}

export async function isAuthenticated(): Promise<boolean> {
  const user = await getSessionUser();
  return !!user;
}
