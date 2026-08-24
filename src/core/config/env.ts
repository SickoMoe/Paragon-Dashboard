const readBooleanEnv = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) return fallback;
  return value.toLowerCase() === "true";
};

const readRealtimeUrl = (apiBaseUrl: string) => {
  const explicit = import.meta.env.VITE_REALTIME_URL;
  if (explicit) return explicit;

  const base = apiBaseUrl || (typeof window === "undefined" ? "http://127.0.0.1" : window.location.origin);
  const url = new URL("/ws", base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  return url.toString();
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const appEnv = {
  apiBaseUrl,
  realtimeUrl: readRealtimeUrl(apiBaseUrl),
  devAdminHeadersEnabled:
    import.meta.env.DEV && readBooleanEnv(import.meta.env.VITE_ENABLE_DEV_ADMIN_HEADERS, true),
};
