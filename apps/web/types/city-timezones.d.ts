declare module "city-timezones" {
  interface CityTimezoneRow {
    city?: string;
    city_ascii?: string;
    province?: string;
    country?: string;
    iso2?: string;
    timezone?: string;
    pop?: number;
  }

  const cityTimezones: {
    lookupViaCity(city: string): CityTimezoneRow[];
    findFromCityStateProvince(searchString: string): CityTimezoneRow[];
    cityMapping: CityTimezoneRow[];
  };

  export default cityTimezones;
}
