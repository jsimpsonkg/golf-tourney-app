// Unset in production so requests go same-origin (/api/...) against the Vercel
// deploy; set to http://localhost:4000 for local dev.
const base = import.meta.env.VITE_API_URL ?? "";

const PASSWORD_STORAGE_KEY = "golf:site-password";

export const getStoredPassword = (): string =>
  localStorage.getItem(PASSWORD_STORAGE_KEY) ?? "";

export const setStoredPassword = (password: string): void => {
  localStorage.setItem(PASSWORD_STORAGE_KEY, password);
};

export const clearStoredPassword = (): void => {
  localStorage.removeItem(PASSWORD_STORAGE_KEY);
};

const authHeaders = () => ({ "X-Tournament-Pin": getStoredPassword() });

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// Locally there's usually no password set, and prompting for one nobody can
// supply would lock dev out of the site.
export async function fetchPasswordRequired(): Promise<boolean> {
  const { required } = await apiGet<{ required: boolean }>("/api/access");
  return required;
}

export async function verifyPassword(password: string): Promise<boolean> {
  const res = await fetch(`${base}/api/access`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (res.status === 401) return false;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return true;
}

// Stands in for the never-wired Socket.io channel: for a handful of viewers,
// refetching this often is indistinguishable from realtime.
export const LIVE_REFETCH_MS = 15_000;
