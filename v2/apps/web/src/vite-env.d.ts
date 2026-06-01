/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENAI_BASE_URL: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OLLAMA_SERVER_URL: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
