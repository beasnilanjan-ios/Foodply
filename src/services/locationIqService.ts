import GlobalApi from '../GlobalContainer/GlobalApi';

const LOCATIONIQ_BASE_URL = 'https://api.locationiq.com/v1';
const PHOTON_BASE_URL = 'https://photon.komoot.io/api/';

export type AddressSearchBias = {
  lat: number;
  lon: number;
};

export type LocationIqSearchResult = {
  place_id: string;
  display_name: string;
  subtitle: string;
  lat: string;
  lon: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    city_district?: string;
    town?: string;
    village?: string;
    state?: string;
    state_district?: string;
    country?: string;
  };
};

type SearchOptions = {
  bias?: AddressSearchBias | null;
  limit?: number;
};

const getAccessToken = (): string => {
  const token = GlobalApi.locationIqAccessToken?.trim();

  if (!token) {
    throw new Error('LocationIQ access token is not configured.');
  }

  return token;
};

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/\s+/g, ' ').trim();

const buildSubtitle = (address?: LocationIqSearchResult['address']): string => {
  if (!address) {
    return '';
  }

  const locality =
    address.suburb ||
    address.neighbourhood ||
    address.city_district ||
    address.town ||
    address.village ||
    '';
  const city = address.city || address.town || address.village || '';
  const state = address.state || address.state_district || '';

  return [locality, city, state].filter(Boolean).join(', ');
};

const buildViewbox = (bias: AddressSearchBias, delta = 0.4): string => {
  const minLon = bias.lon - delta;
  const minLat = bias.lat - delta;
  const maxLon = bias.lon + delta;
  const maxLat = bias.lat + delta;

  return `${minLon},${minLat},${maxLon},${maxLat}`;
};

const enhanceQueryForIndia = (input: string): string => {
  const trimmed = input.trim();

  if (!trimmed || /india/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}, India`;
};

const mapLocationIqItem = (item: any): LocationIqSearchResult | null => {
  const displayName = String(item?.display_name ?? '').trim();
  const displayPlace = String(item?.display_place ?? '').trim();
  const displayAddress = String(item?.display_address ?? '').trim();
  const resolvedName =
    displayName ||
    [displayPlace, displayAddress].filter(Boolean).join(', ').trim();

  if (!resolvedName) {
    return null;
  }

  const address = item?.address;

  return {
    place_id: String(item?.place_id ?? item?.osm_id ?? ''),
    display_name: resolvedName,
    subtitle: displayAddress || buildSubtitle(address),
    lat: String(item?.lat ?? ''),
    lon: String(item?.lon ?? ''),
    address,
  };
};

const mapPhotonItem = (feature: any): LocationIqSearchResult | null => {
  const properties = feature?.properties ?? {};
  const coordinates = feature?.geometry?.coordinates ?? [];
  const countryCode = String(properties?.countrycode ?? '').toUpperCase();
  const country = String(properties?.country ?? '');

  if (countryCode && countryCode !== 'IN') {
    return null;
  }

  if (country && !/india/i.test(country)) {
    return null;
  }

  const name = String(properties?.name ?? '').trim();
  const street = String(properties?.street ?? '').trim();
  const district = String(properties?.district ?? properties?.county ?? '').trim();
  const city = String(properties?.city ?? properties?.locality ?? '').trim();
  const state = String(properties?.state ?? '').trim();

  const displayParts = [name, street, district, city, state].filter(Boolean);
  const displayName = displayParts.join(', ').trim();

  if (!displayName) {
    return null;
  }

  const lat = String(coordinates[1] ?? '');
  const lon = String(coordinates[0] ?? '');

  if (!lat || !lon) {
    return null;
  }

  return {
    place_id: String(properties?.osm_id ?? properties?.place_id ?? displayName),
    display_name: displayName,
    subtitle: [city, state].filter(Boolean).join(', '),
    lat,
    lon,
    address: {
      road: street || name,
      suburb: district,
      city,
      state,
      country: country || 'India',
    },
  };
};

const locationIqRequest = async (
  endpoint: '/autocomplete' | '/search',
  params: Record<string, string>,
): Promise<LocationIqSearchResult[]> => {
  const url = new URL(`${LOCATIONIQ_BASE_URL}${endpoint}`);

  url.searchParams.set('key', getAccessToken());
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('countrycodes', 'in');
  url.searchParams.set('accept-language', 'en');
  url.searchParams.set('dedupe', '1');
  url.searchParams.set('normalizecity', '1');

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`LocationIQ request failed (${response.status})`);
  }

  const data = await response.json();

  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map(mapLocationIqItem)
    .filter(
      (item): item is LocationIqSearchResult =>
        item !== null && Boolean(item.display_name && item.lat && item.lon),
    );
};

const searchPhotonAddresses = async (
  input: string,
  options?: SearchOptions,
): Promise<LocationIqSearchResult[]> => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return [];
  }

  const url = new URL(PHOTON_BASE_URL);
  url.searchParams.set('q', enhanceQueryForIndia(trimmedInput));
  url.searchParams.set('limit', String(options?.limit ?? 8));
  url.searchParams.set('lang', 'en');

  if (options?.bias) {
    url.searchParams.set('lat', String(options.bias.lat));
    url.searchParams.set('lon', String(options.bias.lon));
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    return [];
  }

  const data = await response.json();
  const features = Array.isArray(data?.features) ? data.features : [];

  return features
    .map(mapPhotonItem)
    .filter(
      (item): item is LocationIqSearchResult =>
        item !== null && Boolean(item.display_name && item.lat && item.lon),
    );
};

const mergeResults = (
  ...lists: LocationIqSearchResult[][]
): LocationIqSearchResult[] => {
  const seen = new Set<string>();
  const merged: LocationIqSearchResult[] = [];

  lists.forEach(list => {
    list.forEach(item => {
      const key = normalizeText(item.display_name);
      if (!key || seen.has(key)) {
        return;
      }

      seen.add(key);
      merged.push(item);
    });
  });

  return merged;
};

const rankResults = (
  query: string,
  results: LocationIqSearchResult[],
): LocationIqSearchResult[] => {
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(' ').filter(Boolean);

  const score = (item: LocationIqSearchResult): number => {
    const haystack = normalizeText(`${item.display_name} ${item.subtitle}`);
    let value = 0;

    if (haystack.startsWith(normalizedQuery)) {
      value += 100;
    } else if (haystack.includes(normalizedQuery)) {
      value += 60;
    }

    tokens.forEach(token => {
      if (haystack.includes(token)) {
        value += 12;
      }
    });

    if (/india/i.test(haystack)) {
      value += 5;
    }

    return value;
  };

  return [...results].sort((left, right) => score(right) - score(left));
};

const buildLocationIqParams = (
  input: string,
  options?: SearchOptions,
): Record<string, string> => {
  const params: Record<string, string> = {
    q: input,
    limit: String(options?.limit ?? 10),
  };

  if (options?.bias) {
    params.viewbox = buildViewbox(options.bias);
  }

  return params;
};

export const searchLocationIqAddresses = async (
  input: string,
  options?: SearchOptions,
): Promise<LocationIqSearchResult[]> => {
  const trimmedInput = input.trim();

  if (!trimmedInput) {
    return [];
  }

  const indiaQuery = enhanceQueryForIndia(trimmedInput);
  const locationIqParams = buildLocationIqParams(trimmedInput, options);
  const indiaSearchParams = buildLocationIqParams(indiaQuery, {
    ...options,
    limit: options?.limit ?? 8,
  });

  const [autocompleteResults, searchResults, indiaSearchResults, photonResults] =
    await Promise.all([
      locationIqRequest('/autocomplete', locationIqParams).catch(() => []),
      locationIqRequest('/search', {
        ...locationIqParams,
        limit: String(options?.limit ?? 8),
      }).catch(() => []),
      trimmedInput === indiaQuery
        ? Promise.resolve([])
        : locationIqRequest('/search', {
            ...indiaSearchParams,
            limit: String(options?.limit ?? 8),
          }).catch(() => []),
      searchPhotonAddresses(trimmedInput, options).catch(() => []),
    ]);

  const merged = mergeResults(
    autocompleteResults,
    searchResults,
    indiaSearchResults,
    photonResults,
  );

  return rankResults(trimmedInput, merged).slice(0, options?.limit ?? 10);
};

export const reverseGeocodeLocationIq = async (
  lat: number,
  lon: number,
): Promise<LocationIqSearchResult> => {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('Invalid coordinates for reverse geocoding.');
  }

  const url = new URL(`${LOCATIONIQ_BASE_URL}/reverse`);
  url.searchParams.set('key', getAccessToken());
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('accept-language', 'en');
  url.searchParams.set('normalizecity', '1');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lon));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`LocationIQ request failed (${response.status})`);
  }

  const data = await response.json();
  const mapped = mapLocationIqItem(data);

  if (!mapped?.display_name || !mapped.lat || !mapped.lon) {
    throw new Error('Could not resolve your current location to an address.');
  }

  return mapped;
};

export const resolveLocationIqAddress = async (
  query: string,
  selected?: LocationIqSearchResult | null,
  options?: SearchOptions,
): Promise<LocationIqSearchResult> => {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    throw new Error('Please enter an address.');
  }

  if (
    selected &&
    selected.display_name.toLowerCase() === trimmedQuery.toLowerCase() &&
    selected.lat &&
    selected.lon
  ) {
    return selected;
  }

  const matches = await searchLocationIqAddresses(trimmedQuery, {
    ...options,
    limit: 8,
  });
  const exactMatch = matches.find(
    item => item.display_name.toLowerCase() === trimmedQuery.toLowerCase(),
  );
  const matchedResult = exactMatch ?? matches[0];

  if (!matchedResult) {
    throw new Error('Could not find coordinates for this address.');
  }

  return matchedResult;
};
