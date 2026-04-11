/**
 * Authenticated fetch wrapper.
 * Reads the JWT from localStorage and attaches it as a Bearer token
 * on every request. Drop-in replacement for fetch().
 */
export function apiFetch(url, options = {}) {
  const token = localStorage.getItem('soma_token');
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
}
