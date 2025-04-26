/**
 * Site configuration for managing URLs consistently across the application
 * Uses environment variables with appropriate fallbacks
 */

// For frontend usage with Vite, we need to use import.meta.env format
const SITE_URL = import.meta.env.VITE_NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

/**
 * Ensures a URL doesn't have trailing slashes for consistent path joining
 */
function normalizeUrl(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

/**
 * Joins a base URL with a path, ensuring proper slash handling
 */
function joinUrl(base: string, path: string): string {
  const normalizedBase = normalizeUrl(base);
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export const siteConfig = {
  baseUrl: normalizeUrl(SITE_URL),
  /**
   * Generates a full URL by combining the base URL with a given path
   */
  getUrl: (path: string): string => joinUrl(SITE_URL, path),
  /**
   * Get API URL for a specific endpoint
   */
  getApiUrl: (endpoint: string): string => joinUrl(SITE_URL, joinUrl('/api', endpoint)),
}; 