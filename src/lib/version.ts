export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? "dev"
export const GIT_HASH = import.meta.env.VITE_GIT_HASH ?? "local"

export function formatVersion() {
  const short = GIT_HASH.length > 7 ? GIT_HASH.slice(0, 7) : GIT_HASH
  return APP_VERSION === "dev" ? "dev" : `v${APP_VERSION} (${short})`
}
