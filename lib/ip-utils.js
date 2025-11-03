/**
 * IP Extraction and Validation Utilities
 *
 * Vendor-agnostic utilities for extracting and validating client IP addresses
 * from HTTP request headers.
 */

/**
 * Extract client IP address from request headers
 * Works with any platform (Vercel, AWS, Cloudflare, self-hosted)
 *
 * @param {Headers} headers - Request headers object
 * @returns {string|null} - Client IP address or null if not found
 */
export function getClientIP(headers) {
  // Try headers in order of preference
  const sources = [
    headers.get('x-forwarded-for'),    // Most common in proxied environments
    headers.get('cf-connecting-ip'),   // Cloudflare
    headers.get('x-real-ip'),          // Nginx
    headers.get('x-client-ip'),        // Custom header
  ];

  for (const source of sources) {
    if (source) {
      // If multiple IPs (proxy chain), take the first (original client)
      const ip = source.split(',')[0].trim();
      // Remove IPv6 brackets if present
      return ip.replace(/[\[\]]/g, '');
    }
  }

  return null;
}

/**
 * Validate IPv4 address format
 *
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IPv4
 */
export function isValidIPv4(ip) {
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const match = ip.match(ipv4Regex);

  if (!match) return false;

  // Check each octet is 0-255
  return match.slice(1).every(octet => {
    const num = parseInt(octet, 10);
    return num >= 0 && num <= 255;
  });
}

/**
 * Validate IPv6 address format
 *
 * @param {string} ip - IP address to validate
 * @returns {boolean} - True if valid IPv6
 */
export function isValidIPv6(ip) {
  // Simplified IPv6 regex
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|::1|::)$/;
  return ipv6Regex.test(ip);
}

/**
 * Check if IP is a private/local address
 *
 * @param {string} ip - IP address to check
 * @returns {boolean} - True if private IP
 */
export function isPrivateIP(ip) {
  // Localhost
  if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') return true;

  // IPv4 private ranges (RFC 1918)
  if (/^10\./.test(ip)) return true;                        // 10.0.0.0/8
  if (/^172\.(1[6-9]|2[0-9]|3[01])\./.test(ip)) return true; // 172.16.0.0/12
  if (/^192\.168\./.test(ip)) return true;                   // 192.168.0.0/16
  if (/^169\.254\./.test(ip)) return true;                   // 169.254.0.0/16 (link-local)

  // IPv6 private ranges
  if (/^fc[0-9a-f]{2}:/i.test(ip)) return true; // Unique local
  if (/^fe80:/i.test(ip)) return true;          // Link-local

  return false;
}

/**
 * Validate and parse IP address with metadata
 *
 * @param {string} ip - IP address to validate
 * @returns {Object} - IP info object
 */
export function validateAndParseIP(ip) {
  if (!ip) {
    return {
      ip: null,
      valid: false,
      isPrivate: false,
      isIPv6: false,
      version: 'unknown',
    };
  }

  const cleanIP = ip.replace(/[\[\]]/g, '');

  const isIPv4Valid = isValidIPv4(cleanIP);
  const isIPv6Valid = isValidIPv6(cleanIP);
  const valid = isIPv4Valid || isIPv6Valid;
  const isPriv = valid ? isPrivateIP(cleanIP) : false;

  return {
    ip: cleanIP,
    valid,
    isPrivate: isPriv,
    isIPv6: isIPv6Valid,
    version: isIPv4Valid ? 'ipv4' : isIPv6Valid ? 'ipv6' : 'unknown',
  };
}

/**
 * Get and validate client IP from request
 *
 * @param {Headers} headers - Request headers
 * @returns {Object|null} - Validated IP info or null
 */
export function getValidClientIP(headers) {
  const rawIP = getClientIP(headers);

  if (!rawIP) {
    return null;
  }

  const ipInfo = validateAndParseIP(rawIP);

  if (!ipInfo.valid) {
    console.warn(`[IP Utils] Invalid IP format: ${rawIP}`);
    return null;
  }

  return ipInfo;
}
