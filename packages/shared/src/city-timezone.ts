/** Human-readable label for a city timezone selection. */
export function formatCityTimezoneLabel(
  city: string,
  province: string,
  country: string
): string {
  const parts = [city.trim()];
  const region = province.trim();
  const nation = country.trim();
  if (region && region.toLowerCase() !== city.trim().toLowerCase()) {
    parts.push(region);
  }
  if (nation) parts.push(nation);
  return parts.join(", ");
}

/** Returns true if `tz` is a valid IANA timezone identifier. */
export function isValidIanaTimezone(tz: string): boolean {
  if (!tz.trim()) return false;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}
