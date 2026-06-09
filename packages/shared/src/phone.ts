const E164_REGEX = /^\+[1-9]\d{7,14}$/;

/** Normalize user input to E.164 or null if invalid. */
export function normalizePhoneInput(input: string): string | null {
  const trimmed = input.trim();
  const digits = trimmed.replace(/\D/g, "");

  if (trimmed.startsWith("+")) {
    const candidate = `+${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  if (digits.length === 10) {
    const candidate = `+1${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  if (digits.length === 11 && digits.startsWith("1")) {
    const candidate = `+${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  if (digits.length >= 8 && digits.length <= 15) {
    const candidate = `+${digits}`;
    return E164_REGEX.test(candidate) ? candidate : null;
  }

  return null;
}

export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

/** Mask phone for display, e.g. +15551234567 → +155••••4567 */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "••••";
  const last4 = phone.slice(-4);
  const visiblePrefix = phone.slice(0, Math.min(5, phone.length - 4));
  return `${visiblePrefix}••••${last4}`;
}
