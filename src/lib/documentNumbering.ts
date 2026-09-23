import { Quote, Invoice, Payment } from '@/store';

/**
 * Formats quote number into standard format: QT-YYYY-NNNN (e.g. QT-2026-0059)
 * Also gracefully handles revision numbers: QT-YYYY-NNNN-R1
 */
export function formatQuoteNumber(
  quote?: Partial<Quote> | { id?: string; quoteNumber?: string; date?: string; issueDate?: string } | null
): string {
  if (!quote) return '';

  const fallbackYear = quote.date || quote.issueDate
    ? new Date(quote.date || quote.issueDate!).getFullYear()
    : new Date().getFullYear();

  if (quote.quoteNumber && quote.quoteNumber.trim()) {
    const raw = quote.quoteNumber.trim();

    // Already in standard full format: QT-2026-0059 or QT-2026-0059-R1
    const standardMatch = raw.match(/^QT-(\d{4})-(\d+)(-R\d+)?$/i);
    if (standardMatch) {
      const year = standardMatch[1];
      const num = standardMatch[2].padStart(4, '0');
      const rev = standardMatch[3] ? standardMatch[3].toUpperCase() : '';
      return `QT-${year}-${num}${rev}`;
    }

    // Older format without year: QT-0059 or QT-0059-R1 or QT-59
    const oldMatch = raw.match(/^QT-(\d+)(-R\d+)?$/i);
    if (oldMatch) {
      const num = oldMatch[1].padStart(4, '0');
      const rev = oldMatch[2] ? oldMatch[2].toUpperCase() : '';
      return `QT-${fallbackYear}-${num}${rev}`;
    }

    return raw;
  }

  // Fallback if quoteNumber is not present
  const snippet = quote.id
    ? quote.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
    : '0001';
  return `QT-${fallbackYear}-${snippet.padStart(4, '0')}`;
}

/**
 * Generates the next sequential quote number for the given year, e.g. QT-2026-0059
 */
export function generateNextQuoteNumber(quotes: Quote[], targetYear: number = new Date().getFullYear()): string {
  let maxNum = 0;
  quotes.forEach((q) => {
    const qNum = q.quoteNumber || '';
    const match = qNum.match(/QT-(?:(\d{4})-)?(\d+)/i);
    if (match) {
      const year = match[1] ? parseInt(match[1], 10) : targetYear;
      const num = parseInt(match[2], 10);
      if (year === targetYear && !isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `QT-${targetYear}-${String(maxNum + 1).padStart(4, '0')}`;
}

/**
 * Generates revision quote number, e.g. QT-2026-0059-R1
 */
export function generateQuoteRevisionNumber(originalQuote: Quote, quotes: Quote[]): string {
  const baseNumber = formatQuoteNumber(originalQuote);
  const baseWithoutRev = baseNumber.replace(/-R\d+$/i, '');

  let maxRev = 0;
  quotes.forEach((q) => {
    const formatted = formatQuoteNumber(q);
    if (formatted.startsWith(`${baseWithoutRev}-R`)) {
      const revPart = formatted.split(/-R/i)[1];
      if (revPart) {
        const num = parseInt(revPart, 10);
        if (!isNaN(num) && num > maxRev) {
          maxRev = num;
        }
      }
    }
  });
  return `${baseWithoutRev}-R${maxRev + 1}`;
}

/**
 * Formats invoice number into standard format: INV-YYYY-NNNN (e.g. INV-2026-0059)
 * If linked to a quote, cleanly mirrors the quote number with INV- prefix.
 */
export function formatInvoiceNumber(
  invoice?: Partial<Invoice> | { id?: string; invoiceNumber?: string; quoteId?: string; date?: string; dueDate?: string } | null,
  quote?: Partial<Quote> | null,
  quotesList?: Quote[]
): string {
  if (!invoice) return '';

  const fallbackYear = invoice.date
    ? new Date(invoice.date).getFullYear()
    : new Date().getFullYear();

  // If invoice has an explicit invoiceNumber:
  if (invoice.invoiceNumber && invoice.invoiceNumber.trim()) {
    const raw = invoice.invoiceNumber.trim();
    const standardMatch = raw.match(/^INV-(\d{4})-(\d+)(-R\d+)?$/i);
    if (standardMatch) {
      const year = standardMatch[1];
      const num = standardMatch[2].padStart(4, '0');
      const rev = standardMatch[3] ? standardMatch[3].toUpperCase() : '';
      return `INV-${year}-${num}${rev}`;
    }
    const oldMatch = raw.match(/^INV-(\d+)(-R\d+)?$/i);
    if (oldMatch) {
      const num = oldMatch[1].padStart(4, '0');
      const rev = oldMatch[2] ? oldMatch[2].toUpperCase() : '';
      return `INV-${fallbackYear}-${num}${rev}`;
    }
    return raw;
  }

  // Linked quote (passed directly or found in list)
  const linkedQuote = quote || (invoice.quoteId && quotesList ? quotesList.find(q => q.id === invoice.quoteId) : null);
  if (linkedQuote) {
    const qNum = formatQuoteNumber(linkedQuote);
    if (qNum.startsWith('QT-')) {
      return qNum.replace(/^QT-/i, 'INV-');
    }
    return `INV-${qNum}`;
  }

  // Fallback for standalone invoice without quote
  const snippet = invoice.id
    ? invoice.id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
    : '0001';
  return `INV-${fallbackYear}-${snippet.padStart(4, '0')}`;
}

/**
 * Generates next sequential invoice number, e.g. INV-2026-0059
 */
export function generateNextInvoiceNumber(
  invoices: Invoice[],
  quote?: Quote | null,
  targetYear: number = new Date().getFullYear()
): string {
  if (quote) {
    const qNum = formatQuoteNumber(quote);
    if (qNum.startsWith('QT-')) {
      return qNum.replace(/^QT-/i, 'INV-');
    }
  }

  let maxNum = 0;
  invoices.forEach((inv) => {
    const invNum = inv.invoiceNumber || '';
    const match = invNum.match(/INV-(?:(\d{4})-)?(\d+)/i);
    if (match) {
      const year = match[1] ? parseInt(match[1], 10) : targetYear;
      const num = parseInt(match[2], 10);
      if (year === targetYear && !isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  return `INV-${targetYear}-${String(maxNum + 1).padStart(4, '0')}`;
}

/**
 * Formats receipt number into standard format: RCT-YYYY-XXXXXX (e.g. RCT-2026-252CD0)
 * Takes payment date year and a 6-character hexadecimal/alphanumeric unique code.
 */
export function formatReceiptNumber(
  payment?: Partial<Payment> | { id: string; date?: string; receiptNumber?: string } | null
): string {
  if (!payment) return '';

  const fallbackYear = payment.date
    ? new Date(payment.date).getFullYear()
    : new Date().getFullYear();

  if (payment.receiptNumber && payment.receiptNumber.trim()) {
    const raw = payment.receiptNumber.trim();
    // Already in format RCT-YYYY-XXXXXX
    const standardMatch = raw.match(/^RCT-(\d{4})-([A-Z0-9]{4,8})$/i);
    if (standardMatch) {
      return `RCT-${standardMatch[1]}-${standardMatch[2].toUpperCase()}`;
    }
    // Old format without year: RCT-XXXXXX
    const oldMatch = raw.match(/^RCT-([A-Z0-9]{4,8})$/i);
    if (oldMatch) {
      return `RCT-${fallbackYear}-${oldMatch[1].toUpperCase()}`;
    }
    return raw.toUpperCase();
  }

  // Derive from payment.id
  const cleanId = (payment.id || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const code = cleanId.length >= 6 ? cleanId.slice(0, 6) : cleanId.padEnd(6, '0');
  return `RCT-${fallbackYear}-${code || '000000'}`;
}
