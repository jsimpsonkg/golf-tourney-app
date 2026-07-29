// The one place that knows the API base URL and fetch semantics.
//
// VITE_API_URL bridges to a separate backend origin during local dev
// (http://localhost:4000). Left unset in production it falls back to "", so
// requests go same-origin (/api/...) — which is how the Vercel deploy serves
// the API alongside the client, no CORS involved.
const base = import.meta.env.VITE_API_URL ?? "";

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${base}${path}`);
  if (!res.ok) {
    throw new Error(`${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// Poll interval for views that change live during a tournament. This is the
// replacement for the (never-wired) Socket.io channel: for a handful of
// viewers, refetching every few seconds is indistinguishable from realtime and
// carries none of the connection-state complexity.
export const LIVE_REFETCH_MS = 15_000;
