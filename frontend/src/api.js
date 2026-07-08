const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

function buildUrl(path) {
  return `${API_BASE_URL}${path}`;
}

export async function apiFetch(path, options = {}) {
  const response = await fetch(buildUrl(path), {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.detail?.message || data?.detail || "Request failed");
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export function getStoredAdminToken() {
  return localStorage.getItem("reaney_admin_token") || "";
}

export function getStoredRefreshToken() {
  return localStorage.getItem("reaney_admin_refresh_token") || "";
}

export function setStoredAdminToken(token) {
  if (token) localStorage.setItem("reaney_admin_token", token);
  else localStorage.removeItem("reaney_admin_token");
}

export function setStoredRefreshToken(token) {
  if (token) localStorage.setItem("reaney_admin_refresh_token", token);
  else localStorage.removeItem("reaney_admin_refresh_token");
}

export function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}
