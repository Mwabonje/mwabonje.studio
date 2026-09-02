import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parsePhoneNumberFromString, AsYouType } from 'libphonenumber-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phone: string, defaultCountry: any = 'KE'): string {
  if (!phone) return "";
  
  // Clean up the string to remove unexpected characters, keep + and digits
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  const parsed = parsePhoneNumberFromString(phone, defaultCountry);
  if (parsed && parsed.isValid()) {
    return parsed.formatInternational();
  }
  
  // As a fallback, use AsYouType for partial formatting
  return new AsYouType(defaultCountry).input(phone);
}
