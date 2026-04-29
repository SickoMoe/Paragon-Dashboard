export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  // ✅ dev-only admin “login” header
  if (import.meta.env.DEV) {
    headers.set("x-dev-admin", "1");
    headers.set("x-dev-session-id", "dashboard-dev");
  }

  const res = await fetch(url, {
    ...init,
    headers,
  });

  if (!res.ok) {
    let msg = "";
    try {
      const j = await res.json();
      msg = j?.error || j?.message || "";
    } catch {}
    throw new Error(msg || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}