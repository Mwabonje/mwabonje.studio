import { Settings } from '@/store';

/**
 * Returns the user's photography business/studio name.
 * Uses settings.companyName, falls back to settings.ownerName (with 'Photography'),
 * or defaults to 'Photography Studio' / 'The Photographer'.
 */
export function getPhotographyName(settings?: Partial<Settings> | null): string {
  if (!settings) return 'Photography Studio';

  const companyName = settings.companyName?.trim();
  if (companyName && companyName.toLowerCase() !== 'capturecrm') {
    return companyName;
  }

  const ownerName = settings.ownerName?.trim();
  if (ownerName) {
    return ownerName.toLowerCase().endsWith('photography') || ownerName.toLowerCase().endsWith('studio')
      ? ownerName
      : `${ownerName} Photography`;
  }

  if (companyName) {
    return companyName;
  }

  return 'Photography Studio';
}

/**
 * Returns the brand name suitable for legal / terms clauses (e.g. 'The Photographer' if studio name is generic).
 */
export function getPhotographyLegalName(settings?: Partial<Settings> | null): string {
  const name = getPhotographyName(settings);
  if (name === 'Photography Studio') {
    return 'The Photographer';
  }
  return name;
}

/**
 * Sanitizes quote or agreement terms to replace any legacy hardcoded 'Mwabonje Photography'
 * with the user's actual photography / studio brand name.
 */
export function sanitizeTermsText(text: string | undefined | null, photographyName: string): string {
  if (!text) return '';
  const targetName = photographyName && photographyName !== 'Photography Studio'
    ? photographyName
    : 'The Photographer';

  return text.replace(/Mwabonje Photography/g, targetName);
}

/**
 * Generates the default quote terms tailored to the user's photography business name.
 */
export function getDefaultQuoteTerms(settings?: Partial<Settings> | null) {
  const brand = getPhotographyLegalName(settings);

  return {
    quoteValidity: 'This quotation is valid for 7 days from the date issued.',
    retainerClause:
      'Payment is split as follows: 50% retainer to confirm your booking, 45% on the day of the shoot, and the final 5% on delivery of your edited gallery.',
    fulfillmentSchedule:
      'High-resolution digital files delivered via online gallery within 2-3 business days of the shoot.',
    usageLicense:
      'Personal and social media sharing included. Commercial licensing available on request.',
    usageRights:
      `${brand} retains copyright. Selected images/videos may be used for portfolio purposes unless privacy is requested. RAW files are not included and are only available as an add-on (Ksh 5,000) alongside a booked package.`,
    transportLogistics:
      'Transport for both locations is included. Transport outside the mentioned locations will be billed at cost.',
    cancellationRescheduling:
      "Cancellation by client: deposit is non-refundable. Rescheduling: minimum 72 hours' notice, subject to availability. Cancellation by photographer: full refund of all payments made.",
    weatherConditions:
      `${brand} shall not be held liable for delays, rescheduling, or failure to deliver services due to circumstances beyond reasonable control. These include, but are not limited to, extreme weather conditions, acts of God, government restrictions, illness, equipment failure, or other unforeseen events. In such cases, both parties will work together in good faith to reschedule the session or agree on a fair solution.`,
    selectionAndStorage:
      'Clients are required to submit their image selections within 10 days of receiving the proof gallery. Projects without a response after 10 days will be placed on hold and rescheduled based on the photographer\'s current workload. If the project remains inactive for more than 21 days, a Project Reactivation Fee will apply before work resumes as follows: KSh 3,000 for projects inactive for 22–60 days, KSh 5,000 for 61–90 days, and KSh 7,000 for projects inactive for more than 90 days, subject to file availability.',
  };
}
