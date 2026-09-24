import { Settings } from '@/store';
import { auth } from '@/lib/firebase';

/**
 * Formats a name so each word starts with a capital letter and the rest are lowercase.
 * e.g. "MWABONJE" -> "Mwabonje"
 *      "mwabonje" -> "Mwabonje"
 *      "XYZ" -> "Xyz"
 *      "apex visuals" -> "Apex Visuals"
 *      "MWABONJE PHOTOGRAPHY" -> "Mwabonje Photography"
 */
export function formatCapitalizedName(name: string | undefined | null): string {
  if (!name) return '';
  return name
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return '';
      // Support hyphenated names e.g. "mary-anne" -> "Mary-Anne"
      return word
        .split('-')
        .map(part => {
          if (!part) return '';
          // Support apostrophes e.g. "john's" or "o'neill"
          if (part.includes("'")) {
            return part
              .split("'")
              .map((sub, idx) => {
                if (!sub) return '';
                if (idx > 0 && sub.toLowerCase() === 's') return 's';
                return sub.charAt(0).toUpperCase() + sub.slice(1).toLowerCase();
              })
              .join("'");
          }
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        })
        .join('-');
    })
    .join(' ');
}

/**
 * Returns the user's photography business/studio name formatted with
 * capital first letter and small following letters.
 * Uses settings.companyName, falls back to settings.ownerName (with 'Photography'),
 * or user's display name from auth, or defaults to 'Photography Studio'.
 * Guarantees 'CaptureCRM' is never picked as the studio name.
 */
export function getPhotographyName(settings?: Partial<Settings> | null): string {
  const companyName = settings?.companyName?.trim();
  if (companyName && companyName.toLowerCase() !== 'capturecrm') {
    return formatCapitalizedName(companyName);
  }

  const ownerName = settings?.ownerName?.trim();
  if (ownerName) {
    const formattedOwner = formatCapitalizedName(ownerName);
    return formattedOwner.toLowerCase().endsWith('photography') || formattedOwner.toLowerCase().endsWith('studio')
      ? formattedOwner
      : `${formattedOwner} Photography`;
  }

  // Fallback to auth user's display name or email if available
  try {
    const user = auth.currentUser;
    if (user?.displayName) {
      const cleanName = user.displayName.replace(/\s*\(.*?\)\s*/g, '').trim();
      if (cleanName && cleanName.toLowerCase() !== 'capturecrm') {
        const formatted = formatCapitalizedName(cleanName);
        return formatted.toLowerCase().endsWith('photography') || formatted.toLowerCase().endsWith('studio')
          ? formatted
          : `${formatted} Photography`;
      }
    } else if (user?.email) {
      const emailName = user.email.split('@')[0];
      const parts = emailName.split(/[\s._-]+/).filter(Boolean);
      if (parts.length > 0 && emailName.toLowerCase() !== 'capturecrm') {
        const formatted = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ');
        return `${formatted} Photography`;
      }
    }
  } catch (e) {
    // Ignore in non-auth contexts
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
  return formatCapitalizedName(name);
}

/**
 * Sanitizes quote or agreement terms to replace any legacy hardcoded 'Mwabonje Photography',
 * 'MWABONJE', or 'CaptureCRM' with the user's actual photography / studio brand name
 * formatted with capital first letter and lowercase rest.
 */
export function sanitizeTermsText(text: string | undefined | null, photographyName: string): string {
  if (!text) return '';
  const targetName = photographyName && photographyName !== 'Photography Studio'
    ? formatCapitalizedName(photographyName)
    : 'The Photographer';

  let sanitized = text
    .replace(/Mwabonje\s+Photography/gi, targetName)
    .replace(/Mwabonje/gi, targetName)
    .replace(/CaptureCRM\s+Photography/gi, targetName)
    .replace(/CaptureCRM/gi, targetName);

  if (targetName && targetName !== 'The Photographer') {
    const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    sanitized = sanitized.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), targetName);
  }

  return sanitized;
}

/**
 * Sanitizes payment instructions text to replace any legacy hardcoded 'CaptureCRM' or 'Mwabonje'
 * with the user's actual business/photography name.
 */
export function sanitizePaymentDetails(details: string | undefined | null, settings?: Partial<Settings> | null): string {
  if (!details) return '';
  const targetName = getPhotographyName(settings);
  let res = details
    .replace(/Acc Name:\s*CaptureCRM/gi, `Acc Name: ${targetName}`)
    .replace(/CaptureCRM/gi, targetName)
    .replace(/Acc Name:\s*MWABONJE/gi, `Acc Name: ${targetName}`)
    .replace(/Mwabonje\s+Photography/gi, targetName)
    .replace(/Mwabonje/gi, targetName);

  if (targetName && targetName !== 'Photography Studio') {
    const escaped = targetName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    res = res.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), targetName);
  }

  return res;
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
