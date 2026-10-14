// Prefer same-origin `/api` so Vite (dev) or reverse proxy can forward to the API.
// Absolute URLs like http://localhost:4000 break on phones (phone localhost ≠ your PC).
const API_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'hope_member_token';
const USER_KEY = 'hope_member_user';

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

export function hasStoredToken() {
  return Boolean(getToken());
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && options.body != null) {
    headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      body:
        options.body instanceof FormData || options.body == null
          ? options.body
          : JSON.stringify(options.body),
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_URL}. Is nodejs-server running on port 4000?`
    );
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearAuthSession();
    }
    const error = new Error(payload.message || 'Request failed');
    error.status = response.status;
    error.details = payload.details;
    throw error;
  }

  return payload;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  delete: (path) => request(path, { method: 'DELETE' }),
  upload: (path, formData) =>
    request(path, { method: 'POST', body: formData }),
};

export default api;
