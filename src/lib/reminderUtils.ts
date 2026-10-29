import { Reminder, Expense } from '@/store';

/**
 * Checks if a reminder has already been paid for that specific month in the user's expenses.
 */
export const isReminderPaidForMonth = (reminder: Reminder, expenses: Expense[]): boolean => {
  if (reminder.status === 'paid') return true;
  if (!reminder.dueDate) return false;

  const dueDate = new Date(reminder.dueDate);
  if (isNaN(dueDate.getTime())) return false;

  const year = dueDate.getFullYear();
  const monthNum = String(dueDate.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}-${monthNum}`; // e.g. "2026-10"

  const monthName = dueDate.toLocaleString('en-US', { month: 'long' }).toLowerCase(); // e.g. "october"
  const shortMonthName = dueDate.toLocaleString('en-US', { month: 'short' }).toLowerCase(); // e.g. "oct"

  const remCat = (reminder.category || '').toLowerCase().trim();
  const remTitle = (reminder.title || '').toLowerCase().trim();
  const remDesc = (reminder.description || '').toLowerCase().trim();

  // Also check if reminder title/desc explicitly mentions a month name like "october"
  const months = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const descMentionedMonth = months.find((m) => remDesc.includes(m) || remTitle.includes(m));
  const effectiveMonthName = descMentionedMonth || monthName;

  return expenses.some((exp) => {
    const expDate = exp.date || '';
    const expDesc = (exp.description || '').toLowerCase();
    const expVendor = (exp.vendor || '').toLowerCase();
    const expCat = (exp.category || '').toLowerCase().trim();

    // Check if expense date matches this year-month, or if expense description mentions this specific month
    const dateMatches = expDate.startsWith(yearMonth);
    const descMatchesMonth =
      expDesc.includes(monthName) ||
      expDesc.includes(effectiveMonthName) ||
      (shortMonthName.length >= 3 && expDesc.includes(shortMonthName));

    if (!dateMatches && !descMatchesMonth) {
      return false;
    }

    // NSSF Matching
    if (remCat === 'nssf' || remTitle.includes('nssf') || remDesc.includes('nssf')) {
      return (
        expCat === 'nssf' ||
        expVendor.includes('nssf') ||
        expDesc.includes('nssf')
      );
    }

    // Health Insurance / SHA / NHIF Matching
    if (
      remCat === 'health insurance' ||
      remTitle.includes('health') ||
      remTitle.includes('sha') ||
      remTitle.includes('nhif') ||
      remDesc.includes('health insurance') ||
      remDesc.includes('sha')
    ) {
      return (
        expCat === 'health insurance' ||
        expCat === 'insurance' ||
        expVendor.includes('sha') ||
        expVendor.includes('nhif') ||
        expVendor.includes('social health authority') ||
        expDesc.includes('health insurance') ||
        expDesc.includes('sha')
      );
    }

    // House Rent Matching
    if (remCat === 'house rent' || remTitle.includes('rent') || remDesc.includes('rent')) {
      return (
        expCat === 'house rent' ||
        expCat === 'rent & utilities' ||
        expVendor.includes('rent') ||
        expDesc.includes('rent')
      );
    }

    // Generic match by category
    if (reminder.category && expCat === remCat) {
      return true;
    }

    // Generic match by title
    if (reminder.title && (expDesc.includes(remTitle) || expVendor.includes(remTitle))) {
      return true;
    }

    return false;
  });
};

/**
 * Finds the matching paid expense for a given reminder if one exists.
 */
export const findMatchingExpenseForReminder = (
  reminder: Reminder,
  expenses: Expense[]
): Expense | undefined => {
  if (!reminder.dueDate) return undefined;

  const dueDate = new Date(reminder.dueDate);
  if (isNaN(dueDate.getTime())) return undefined;

  const year = dueDate.getFullYear();
  const monthNum = String(dueDate.getMonth() + 1).padStart(2, '0');
  const yearMonth = `${year}-${monthNum}`;

  const monthName = dueDate.toLocaleString('en-US', { month: 'long' }).toLowerCase();
  const shortMonthName = dueDate.toLocaleString('en-US', { month: 'short' }).toLowerCase();

  const remCat = (reminder.category || '').toLowerCase().trim();
  const remTitle = (reminder.title || '').toLowerCase().trim();

  return expenses.find((exp) => {
    const expDate = exp.date || '';
    const expDesc = (exp.description || '').toLowerCase();
    const expVendor = (exp.vendor || '').toLowerCase();
    const expCat = (exp.category || '').toLowerCase().trim();

    const dateMatches = expDate.startsWith(yearMonth);
    const descMatchesMonth =
      expDesc.includes(monthName) ||
      (shortMonthName.length >= 3 && expDesc.includes(shortMonthName));

    if (!dateMatches && !descMatchesMonth) {
      return false;
    }

    if (remCat === 'nssf' || remTitle.includes('nssf')) {
      return expCat === 'nssf' || expVendor.includes('nssf') || expDesc.includes('nssf');
    }

    if (remCat === 'health insurance' || remTitle.includes('health')) {
      return (
        expCat === 'health insurance' ||
        expCat === 'insurance' ||
        expVendor.includes('sha') ||
        expVendor.includes('nhif') ||
        expDesc.includes('health insurance')
      );
    }

    if (remCat === 'house rent' || remTitle.includes('rent')) {
      return (
        expCat === 'house rent' ||
        expCat === 'rent & utilities' ||
        expVendor.includes('rent') ||
        expDesc.includes('rent')
      );
    }

    if (reminder.category && expCat === remCat) return true;
    return false;
  });
};
