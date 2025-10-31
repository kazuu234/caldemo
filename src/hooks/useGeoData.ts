import { useEffect, useState } from 'react';
import { GeoAPI, type RegionItem, type CountryItem, type CityItem } from '../utils/api';

export interface CountryEntry { name: string; emoji?: string }

export function useGeoData() {
  const [regions, setRegions] = useState<string[]>([]);
  const [countriesByRegion, setCountriesByRegion] = useState<Record<string, CountryEntry[]>>({});
  const [countriesCities, setCountriesCities] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const regs = await GeoAPI.regions();
        if (!mounted) return;
        setRegions(regs.map(r => r.name));
        const countries = await GeoAPI.countries();
        if (!mounted) return;
        const byRegion: Record<string, CountryEntry[]> = {};
        for (const c of countries) {
          const key = c.region.name;
          if (!byRegion[key]) byRegion[key] = [];
          byRegion[key].push({ name: c.name });
        }
        setCountriesByRegion(byRegion);
        // cities
        const cities = await GeoAPI.cities();
        if (!mounted) return;
        const cc: Record<string, string[]> = {};
        for (const city of cities) {
          const cname = city.country.name;
          if (!cc[cname]) cc[cname] = [];
          cc[cname].push(city.name);
        }
        setCountriesCities(cc);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { regions, countriesByRegion, countriesCities, loading };
}
