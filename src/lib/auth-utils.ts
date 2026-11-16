export const SUPER_ADMIN_EMAIL = 'ringa.michael@gmail.com';

/**
 * Checks whether the given user email belongs to the primary Super User / Studio Administrator.
 */
export function isSuperUser(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}
