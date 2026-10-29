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

/**
 * Sums all payments for a given statutory category (NSSF, Health Insurance, etc.) for a specific year and month.
 * Accounts for both date timestamps and descriptions mentioning the month, summing all payments made for that month.
 */
export const getMonthlyStatutoryExpenses = (
  category: 'NSSF' | 'Health Insurance' | string,
  year: number,
  month: number, // 1-12
  expenses: Expense[]
): { expenses: Expense[]; total: number; count: number } => {
  const monthNames = [
    'january', 'february', 'march', 'april', 'may', 'june',
    'july', 'august', 'september', 'october', 'november', 'december'
  ];
  const targetMonthName = monthNames[month - 1]; // e.g. "september" or "october"
  const shortMonthName = targetMonthName.slice(0, 3); // e.g. "sep" or "oct"
  const yearMonthPrefix = `${year}-${String(month).padStart(2, '0')}`; // e.g. "2026-10"

  const matchingExpenses = expenses.filter((e) => {
    const expCat = (e.category || '').toLowerCase().trim();
    const expVendor = (e.vendor || '').toLowerCase();
    const expDesc = (e.description || '').toLowerCase();
    const expDate = e.date || '';

    // Check category match
    let isCategoryMatch = false;
    const catLower = category.toLowerCase();
    if (catLower === 'nssf') {
      isCategoryMatch =
        expCat === 'nssf' ||
        expVendor.includes('nssf') ||
        expVendor.includes('national social security') ||
        expDesc.includes('nssf') ||
        expDesc.includes('social security');
    } else if (catLower.includes('health') || catLower.includes('sha')) {
      isCategoryMatch =
        expCat === 'health insurance' ||
        expCat === 'insurance' ||
        expVendor.includes('sha') ||
        expVendor.includes('nhif') ||
        expVendor.includes('social health authority') ||
        expDesc.includes('health insurance') ||
        expDesc.includes('sha');
    } else {
      isCategoryMatch = expCat === catLower || expDesc.includes(catLower) || expVendor.includes(catLower);
    }

    if (!isCategoryMatch) return false;

    // Check month match:
    // If expense description explicitly mentions any calendar month:
    const mentionedMonth = monthNames.find((m) => expDesc.includes(m));
    if (mentionedMonth) {
      return mentionedMonth === targetMonthName;
    }

    // Otherwise, check if date matches this year-month prefix
    if (expDate.startsWith(yearMonthPrefix)) {
      return true;
    }

    // Also check short month name in description if length >= 3
    if (expDesc.includes(targetMonthName) || (shortMonthName.length >= 3 && expDesc.includes(shortMonthName))) {
      return true;
    }

    return false;
  });

  const total = matchingExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return {
    expenses: matchingExpenses,
    total,
    count: matchingExpenses.length
  };
};
