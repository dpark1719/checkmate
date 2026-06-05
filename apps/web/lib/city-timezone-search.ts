import { formatCityTimezoneLabel } from "@checkmate/shared";
import cityTimezones from "city-timezones";

export interface CityTimezoneResult {
  id: string;
  label: string;
  city: string;
  province: string;
  country: string;
  iso2: string;
  timezone: string;
}

interface CityTimezoneResultInternal extends CityTimezoneResult {
  pop: number;
}

type CityRow = {
  city?: string;
  city_ascii?: string;
  province?: string;
  country?: string;
  iso2?: string;
  timezone?: string;
  pop?: number;
};

function dedupeKey(row: CityRow): string {
  const city = (row.city_ascii ?? row.city ?? "").toLowerCase();
  const province = (row.province ?? "").toLowerCase();
  const iso2 = (row.iso2 ?? "").toLowerCase();
  const timezone = (row.timezone ?? "").toLowerCase();
  return `${city}|${province}|${iso2}|${timezone}`;
}

function mapRow(row: CityRow): CityTimezoneResultInternal | null {
  const city = row.city_ascii ?? row.city;
  const timezone = row.timezone;
  const country = row.country ?? "";
  const province = row.province ?? "";
  const iso2 = row.iso2 ?? "";
  if (!city || !timezone) return null;

  const label = formatCityTimezoneLabel(city, province, country);
  return {
    id: dedupeKey(row),
    label,
    city,
    province,
    country,
    iso2,
    timezone,
    pop: row.pop ?? 0,
  };
}

function rankResults(
  results: CityTimezoneResultInternal[]
): CityTimezoneResultInternal[] {
  return [...results].sort((a, b) => b.pop - a.pop);
}

function dedupeResults(rows: CityRow[]): CityTimezoneResultInternal[] {
  const seen = new Set<string>();
  const results: CityTimezoneResultInternal[] = [];

  for (const row of rows) {
    const mapped = mapRow(row);
    if (!mapped || seen.has(mapped.id)) continue;
    seen.add(mapped.id);
    results.push(mapped);
  }

  return rankResults(results);
}

export function searchCities(query: string, limit = 10): CityTimezoneResult[] {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const fromCombined = cityTimezones.findFromCityStateProvince(trimmed) as CityRow[];
  const fromCity = cityTimezones.lookupViaCity(trimmed) as CityRow[];
  const merged = dedupeResults([...fromCombined, ...fromCity]);
  return merged.slice(0, limit).map(({ pop, ...rest }) => {
    void pop;
    return rest;
  });
}

export function resolveTimezone(
  timezone: string
): CityTimezoneResult | null {
  const rows = (cityTimezones.cityMapping as CityRow[]).filter(
    (row) => row.timezone === timezone
  );
  const ranked = dedupeResults(rows);
  if (ranked.length === 0) return null;
  const { pop, ...rest } = ranked[0];
  void pop;
  return rest;
}
