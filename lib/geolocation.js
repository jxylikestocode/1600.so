/**
 * Geolocation Utilities
 *
 * Vendor-agnostic geolocation using ip-api.com (free, no API key required)
 * Works on any hosting platform (Vercel, AWS, Cloudflare, self-hosted)
 */

// Simple in-memory cache to avoid repeated lookups
const geoCache = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch geolocation data from ip-api.com
 *
 * @param {string} ip - IP address to lookup
 * @returns {Promise<Object|null>} - Location data or null on failure
 */
export async function getGeolocation(ip) {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip === '::1') {
    return {
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: null,
      lat: null,
      lon: null,
      isp: 'Unknown',
      isLocal: true,
    };
  }

  // Check cache first
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`[Geolocation] Cache hit for ${ip}`);
    return cached.data;
  }

  try {
    console.log(`[Geolocation] Fetching location for IP: ${ip}`);

    // Call ip-api.com API (free, no API key needed, 45 req/min limit)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,timezone,isp`, {
      method: 'GET',
      headers: {
        'User-Agent': 'SAT-Question-Bank-Analytics/1.0',
      },
      // Add timeout
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (!response.ok) {
      console.error(`[Geolocation] API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.status === 'fail') {
      console.error(`[Geolocation] API returned failure: ${data.message}`);
      return null;
    }

    const locationData = {
      country: data.country || 'Unknown',
      region: data.regionName || 'Unknown',
      city: data.city || 'Unknown',
      timezone: data.timezone || null,
      lat: data.lat || null,
      lon: data.lon || null,
      isp: data.isp || 'Unknown',
      isLocal: false,
    };

    // Cache the result
    geoCache.set(ip, {
      data: locationData,
      timestamp: Date.now(),
    });

    console.log(`[Geolocation] Successfully fetched location for ${ip}: ${locationData.city}, ${locationData.region}, ${locationData.country}`);

    return locationData;

  } catch (error) {
    console.error(`[Geolocation] Error fetching location for ${ip}:`, error.message);
    return null;
  }
}

/**
 * Format location data as human-readable string
 *
 * @param {Object} location - Location object
 * @returns {string} - Formatted location string
 */
export function formatLocationString(location) {
  if (!location || location.isLocal) {
    return 'Local/Unknown';
  }

  const parts = [];

  if (location.city && location.city !== 'Unknown') {
    parts.push(location.city);
  }

  if (location.region && location.region !== 'Unknown') {
    parts.push(location.region);
  }

  if (location.country && location.country !== 'Unknown') {
    parts.push(location.country);
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

/**
 * Clear the geolocation cache (useful for testing)
 */
export function clearGeoCache() {
  geoCache.clear();
  console.log('[Geolocation] Cache cleared');
}

/**
 * Get cache statistics
 *
 * @returns {Object} - Cache stats
 */
export function getCacheStats() {
  return {
    size: geoCache.size,
    entries: Array.from(geoCache.keys()),
  };
}
