import { auth } from './firebase';

export function getResolvedTheme(
  settingsTheme: string | undefined | null,
  settingsCompanyEmail: string | undefined | null
): string {
  const isRingaEmail =
    auth.currentUser?.email === 'ringa.michael@gmail.com' ||
    settingsCompanyEmail === 'ringa.michael@gmail.com';

  if (!settingsTheme || settingsTheme === 'classic') {
    return isRingaEmail ? 'classic' : 'modern';
  }

  return settingsTheme;
}
