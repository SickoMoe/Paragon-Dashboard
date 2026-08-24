import { appEnv } from "../config/env";

export async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  headers.set("Content-Type", "application/json");

  if (appEnv.devAdminHeadersEnabled) {
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

  const contentType = res.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    const body = await res.text();
    const preview = body.trim().slice(0, 80) || "empty response";
    throw new Error(`Expected JSON from ${url}, got ${contentType || "unknown content type"}: ${preview}`);
  }

  return res.json();
}