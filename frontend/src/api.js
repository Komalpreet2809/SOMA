/**
 * Authenticated fetch wrapper.
 * Reads the JWT from localStorage and attaches it as a Bearer token
 * on every request. Auto-clears credentials on 401 (expired/invalid token).
 */
export async function apiFetch(url, options = {}) {
  const token = localStorage.getItem('soma_token');
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem('soma_token');
    localStorage.removeItem('soma_username');
    window.dispatchEvent(new Event('soma-auth-expired'));
  }

  return res;
}
