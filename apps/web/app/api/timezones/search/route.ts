import {
  resolveTimezone,
  searchCities,
} from "@/lib/city-timezone-search";
import { jsonError, jsonOk } from "@/lib/api/response";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const timezone = searchParams.get("timezone");
  const query = searchParams.get("q");

  if (timezone) {
    const match = resolveTimezone(timezone);
    return jsonOk({ result: match });
  }

  if (!query) {
    return jsonError("Missing q or timezone parameter", "VALIDATION_ERROR", 400);
  }

  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return jsonOk({ results: [] });
  }
  if (trimmed.length > 60) {
    return jsonError("Query too long", "VALIDATION_ERROR", 400);
  }

  return jsonOk({ results: searchCities(trimmed) });
}
