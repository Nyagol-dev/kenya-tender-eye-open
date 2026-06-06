/**
 * phoneUtils.js
 *
 * Utility for sanitising and validating Kenyan phone numbers to the exact
 * format required by the Safaricom Daraja M-Pesa API:
 *
 *   254XXXXXXXXX  (12 digits, no leading '+', no spaces/dashes)
 *
 * Accepted input formats (all normalised to the same output):
 *   07XXXXXXXX   →  2547XXXXXXXX   (Safaricom / Airtel 07xx)
 *   01XXXXXXXX   →  2541XXXXXXXX   (Airtel 01xx)
 *   +2547XXXXXXXX → 2547XXXXXXXX
 *   2547XXXXXXXX  → 2547XXXXXXXX   (already correct)
 *
 * Invalid inputs (wrong length, non-Kenyan prefix, non-numeric characters
 * after stripping formatting, etc.) throw a descriptive Error.
 */

/**
 * Sanitise and validate a Kenyan phone number for Daraja.
 *
 * @param {string|number} raw  - The phone number as supplied by the user.
 * @returns {string}           - A 12-digit string in the form 254XXXXXXXXX.
 * @throws {Error}             - If the number cannot be normalised to a valid
 *                               Kenyan mobile number.
 */
function sanitizePhoneNumber(raw) {
  if (raw === null || raw === undefined) {
    throw new Error('Phone number is required.');
  }

  // Work with a plain string; strip all whitespace and common formatting chars.
  let phone = String(raw).replace(/[\s\-().]/g, '');

  // Remove a leading '+' (international prefix indicator).
  if (phone.startsWith('+')) {
    phone = phone.slice(1);
  }

  // At this point the string must be digits only.
  if (!/^\d+$/.test(phone)) {
    throw new Error(
      `Invalid phone number "${raw}": contains non-numeric characters after stripping formatting.`
    );
  }

  // ── Normalise to 254XXXXXXXXX ──────────────────────────────────────────────

  if (phone.startsWith('254')) {
    // Already in international format — validate length.
    // Nothing to do beyond the length/prefix checks below.
  } else if (phone.startsWith('07') || phone.startsWith('01')) {
    // Local format: replace leading '0' with '254'.
    phone = '254' + phone.slice(1);
  } else if (phone.startsWith('7') || phone.startsWith('1')) {
    // Missing the leading '0' — still recognisable (e.g. 722000000).
    // Only valid if the resulting number will be 12 digits long.
    phone = '254' + phone;
  } else {
    throw new Error(
      `Invalid phone number "${raw}": unrecognised prefix. ` +
        'Expected a Kenyan number starting with 07, 01, +254, 254, 7, or 1.'
    );
  }

  // ── Final validation ───────────────────────────────────────────────────────

  // Daraja requires exactly 12 digits.
  if (phone.length !== 12) {
    throw new Error(
      `Invalid phone number "${raw}": normalised value "${phone}" ` +
        `has ${phone.length} digits but exactly 12 are required (254XXXXXXXXX).`
    );
  }

  // The 4th digit (index 3) must be 7 or 1 — Kenyan mobile prefixes.
  const mobilePrefix = phone[3];
  if (mobilePrefix !== '7' && mobilePrefix !== '1') {
    throw new Error(
      `Invalid phone number "${raw}": normalised value "${phone}" ` +
        'does not match a known Kenyan mobile prefix (2547... or 2541...).'
    );
  }

  return phone;
}

module.exports = { sanitizePhoneNumber };
