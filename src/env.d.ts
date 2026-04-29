interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  // add other env vars here:
  [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}