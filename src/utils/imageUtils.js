/**
 * Adds a cache-busting timestamp parameter to image URLs
 * @param {string} url - The image URL
 * @returns {string} - The URL with cache-busting parameter
 */
export const addCacheBuster = (url) => {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};

/**
 * Creates a cache-busting URL for profile images
 * @param {string} avatarUrl - The avatar URL
 * @returns {string} - The URL with cache-busting parameter
 */
export const getProfileImageUrl = (avatarUrl) => {
  return addCacheBuster(avatarUrl);
}; 