export const API_BASE_URL = (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:8000/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export interface UserProfile {
  id: string;
  discord_id: string;
  username: string;
  display_name: string;
  discriminator?: string;
  avatar?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const UsersAPI = {
  list(params?: { search?: string; ordering?: string; limit?: number; offset?: number }) {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.ordering) q.set('ordering', params.ordering);
    return request<UserProfile[]>(`/users/${q.toString() ? `?${q.toString()}` : ''}`);
  },
  retrieve(id: string) {
    return request<UserProfile>(`/users/${id}/`);
  },
};

export interface RegionItem { id: string; name: string; code: string }
export interface CountryItem { id: string; name: string; code?: string; region: RegionItem }
export interface CityItem { id: string; name: string; country: CountryItem }

export const GeoAPI = {
  regions() {
    return request<RegionItem[]>(`/regions/`);
  },
  countries(params?: { region?: string; region_code?: string }) {
    const q = new URLSearchParams();
    if (params?.region) q.set('region', params.region);
    if (params?.region_code) q.set('region_code', params.region_code);
    return request<CountryItem[]>(`/countries/${q.toString() ? `?${q.toString()}` : ''}`);
  },
  cities(params?: { country?: string; country_code?: string; region?: string; region_code?: string }) {
    const q = new URLSearchParams();
    if (params?.country) q.set('country', params.country);
    if (params?.country_code) q.set('country_code', params.country_code);
    if (params?.region) q.set('region', params.region);
    if (params?.region_code) q.set('region_code', params.region_code);
    return request<CityItem[]>(`/cities/${q.toString() ? `?${q.toString()}` : ''}`);
  },
};
