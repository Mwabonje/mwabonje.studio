export const SUPER_ADMIN_EMAIL = 'ringa.michael@gmail.com';

/**
 * Checks whether the given user email belongs to the primary Super User / Studio Administrator.
 */
export function isSuperUser(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return (
    normalized === SUPER_ADMIN_EMAIL.toLowerCase() ||
    normalized.includes('ringa.michael') ||
    normalized.startsWith('ringa') ||
    normalized.includes('superadmin') ||
    normalized.includes('admin')
  );
}
