const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api';

function getToken() {
  return localStorage.getItem('hope_gym_token');
}

export function setAuthSession({ token, user }) {
  localStorage.setItem('hope_gym_token', token);
  localStorage.setItem('hope_gym_user', JSON.stringify(user));
}

export function clearAuthSession() {
  localStorage.removeItem('hope_gym_token');
  localStorage.removeItem('hope_gym_user');
}

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem('hope_gym_user') || 'null');
  } catch {
    return null;
  }
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

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body instanceof FormData || options.body == null
        ? options.body
        : JSON.stringify(options.body),
  });

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
