/**
 * Formats a Kenyan phone number into the Daraja API standard format (2547XXXXXXXX or 2541XXXXXXXX).
 * Accepts various input formats such as 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 1XXXXXXXX, +2547XXXXXXXX, +2541XXXXXXXX.
 *
 * @param input - The raw phone number input string.
 * @returns The formatted phone number (12 digits starting with 254) or an empty string if invalid.
 */
export function formatKenyaPhone(input: string): string {
  if (!input) return '';

  // Remove whitespace and common formatting/styling characters
  const cleaned = input.replace(/\s+/g, '').replace(/[-()]/g, '');

  // 1. Check if it's already in +2547XXXXXXXX or +2541XXXXXXXX format
  if (/^\+254[71]\d{8}$/.test(cleaned)) {
    return cleaned.substring(1); // strip the leading '+'
  }

  // 2. Check if it's in 2547XXXXXXXX or 2541XXXXXXXX format
  if (/^254[71]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // 3. Check if it's in 07XXXXXXXX or 01XXXXXXXX format
  if (/^0[71]\d{8}$/.test(cleaned)) {
    return '254' + cleaned.substring(1);
  }

  // 4. Check if it's in 7XXXXXXXX or 1XXXXXXXX format (omitting the leading zero)
  if (/^[71]\d{8}$/.test(cleaned)) {
    return '254' + cleaned;
  }

  // Invalid format
  return '';
}

/**
 * Validates whether the given input is a valid Kenyan mobile phone number.
 * Supports Safaricom, Airtel, Telkom, Equitel, etc., mobile formats (starting with 07xx, 01xx).
 *
 * @param input - The raw phone number input string.
 * @returns True if it's a valid Kenyan mobile number, false otherwise.
 */
export function validateKenyaPhone(input: string): boolean {
  if (!input) return false;

  // Remove whitespace and common formatting/styling characters
  const cleaned = input.replace(/\s+/g, '').replace(/[-()]/g, '');

  return (
    /^\+254[71]\d{8}$/.test(cleaned) ||
    /^254[71]\d{8}$/.test(cleaned) ||
    /^0[71]\d{8}$/.test(cleaned) ||
    /^[71]\d{8}$/.test(cleaned)
  );
}

/**
 * Converts a Daraja-formatted phone number (2547XXXXXXXX or 2541XXXXXXXX) back to the standard
 * national display format (07XXXXXXXX or 01XXXXXXXX).
 *
 * @param daraja - The Daraja-formatted phone number string (with or without a leading '+').
 * @returns The national display format of the number, or the original input if invalid/unrecognized.
 */
export function displayPhone(daraja: string): string {
  if (!daraja) return '';

  // Remove whitespace and common formatting/styling characters
  const cleaned = daraja.replace(/\s+/g, '').replace(/[-()]/g, '');

  // Matches either 2547XXXXXXXX, 2541XXXXXXXX or with a leading plus sign
  if (/^\+?254[71]\d{8}$/.test(cleaned)) {
    const noPlus = cleaned.startsWith('+') ? cleaned.substring(1) : cleaned;
    return '0' + noPlus.substring(3);
  }

  return daraja;
}
