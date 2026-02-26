/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_VERSION: string | undefined
  readonly VITE_GIT_HASH: string | undefined
  readonly VITE_BETTER_AUTH_URL: string | undefined
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
