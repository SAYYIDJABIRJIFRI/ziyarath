/**
 * Subdomain Configuration
 *
 * Maps subdomain names to their corresponding maqam and uroos IDs.
 * Only maqams listed here will have subdomain routing enabled.
 * All others remain on the standard path-based routing (ziyarath.com/maqam/$id).
 *
 * To add a new subdomain, simply add an entry here. For example:
 *   "madavoor": { maqamId: "madavoor", uroosId: "madavoor-uroos" },
 */
export type SubdomainEntry = {
  /** The maqam ID (matches the `id` field in maqams data) */
  maqamId: string;
  /** The uroos ID linked to this maqam (matches uroos `id` field), or null if none */
  uroosId: string | null;
};

/**
 * Registry of subdomains that have dedicated subdomain routing.
 * Key = subdomain name (e.g. "mampuram" for mampuram.ziyarath.com)
 */
export const SUBDOMAIN_REGISTRY: Record<string, SubdomainEntry> = {
  mampuram: {
    maqamId: "mampuram",
    uroosId: "mampuram-uroos",
  },
  // Add more subdomain-enabled places here:
  // madavoor: { maqamId: "madavoor", uroosId: "madavoor-uroos" },
  // beemapally: { maqamId: "beemapally", uroosId: "beemapally-uroos" },
};

/** The root domain (without subdomain) */
export const ROOT_DOMAIN = "ziyarath.com";

/**
 * Extract the subdomain from a hostname.
 * Returns null if the request is for the root domain or www.
 *
 * Examples:
 *   "mampuram.ziyarath.com" → "mampuram"
 *   "ziyarath.com" → null
 *   "www.ziyarath.com" → null
 *   "localhost:3000" → null
 */
export function extractSubdomain(hostname: string): string | null {
  // Strip port if present
  const host = hostname.split(":")[0];

  // Local development: treat as no subdomain
  if (host === "localhost" || host === "127.0.0.1") {
    return null;
  }

  // Must end with the root domain
  if (!host.endsWith(`.${ROOT_DOMAIN}`)) {
    return null;
  }

  // Extract the prefix before root domain
  const prefix = host.slice(0, -(ROOT_DOMAIN.length + 1));

  // No subdomain or just www
  if (!prefix || prefix === "www") {
    return null;
  }

  // Only return if it's a valid registered subdomain
  if (prefix in SUBDOMAIN_REGISTRY) {
    return prefix;
  }

  return null;
}

/**
 * Build the full URL for a maqam detail page, using subdomain if available.
 *
 * @param maqamId - The maqam ID
 * @returns The URL path or full URL
 *
 * Examples:
 *   getMaqamUrl("mampuram") → "https://mampuram.ziyarath.com/maqam"
 *   getMaqamUrl("kondotty")  → "/maqam/kondotty"
 */
export function getMaqamUrl(maqamId: string): string {
  const entry = Object.entries(SUBDOMAIN_REGISTRY).find(
    ([, v]) => v.maqamId === maqamId,
  );
  if (entry) {
    return `https://${entry[0]}.${ROOT_DOMAIN}/maqam`;
  }
  return `/maqam/${maqamId}`;
}

/**
 * Build the full URL for a uroos detail page, using subdomain if available.
 *
 * @param uroosId - The uroos ID
 * @returns The URL path or full URL
 *
 * Examples:
 *   getUroosUrl("mampuram-uroos") → "https://mampuram.ziyarath.com/uroos"
 *   getUroosUrl("kondotty-nercha") → "/uroos/kondotty-nercha"
 */
export function getUroosUrl(uroosId: string): string {
  const entry = Object.entries(SUBDOMAIN_REGISTRY).find(
    ([, v]) => v.uroosId === uroosId,
  );
  if (entry) {
    return `https://${entry[0]}.${ROOT_DOMAIN}/uroos`;
  }
  return `/uroos/${uroosId}`;
}

/**
 * Check if a maqam has subdomain routing enabled.
 */
export function isSubdomainMaqam(maqamId: string): boolean {
  return Object.values(SUBDOMAIN_REGISTRY).some(
    (v) => v.maqamId === maqamId,
  );
}

/**
 * Check if a uroos has subdomain routing enabled.
 */
export function isSubdomainUroos(uroosId: string): boolean {
  return Object.values(SUBDOMAIN_REGISTRY).some(
    (v) => v.uroosId === uroosId,
  );
}

/**
 * Reverse lookup: given a maqamId, find its subdomain name.
 * Returns null if not a subdomain maqam.
 */
export function getSubdomainForMaqam(maqamId: string): string | null {
  const entry = Object.entries(SUBDOMAIN_REGISTRY).find(
    ([, v]) => v.maqamId === maqamId,
  );
  return entry ? entry[0] : null;
}

/**
 * Reverse lookup: given a uroosId, find its subdomain name.
 * Returns null if not a subdomain uroos.
 */
export function getSubdomainForUroos(uroosId: string): string | null {
  const entry = Object.entries(SUBDOMAIN_REGISTRY).find(
    ([, v]) => v.uroosId === uroosId,
  );
  return entry ? entry[0] : null;
}
