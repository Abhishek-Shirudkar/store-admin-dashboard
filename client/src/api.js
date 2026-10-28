const TOKEN_KEY = 'store-admin-token';

// In development the Vite proxy forwards /api to localhost:4000.
// In production set VITE_API_URL to your hosted API, e.g. https://my-api.onrender.com
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable, user will log in again next visit */
  }
};

async function request(path, { method = 'GET', body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && path !== '/login') {
    setToken(null);
    window.dispatchEvent(new Event('auth-expired'));
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request('/login', { method: 'POST', body: { email, password } }),
  stats: () => request('/stats'),
  orders: () => request('/orders'),
  categories: () => request('/categories'),
  products: (params) => request(`/products?${new URLSearchParams(params)}`),
  createProduct: (p) => request('/products', { method: 'POST', body: p }),
  updateProduct: (id, p) => request(`/products/${id}`, { method: 'PUT', body: p }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
};
