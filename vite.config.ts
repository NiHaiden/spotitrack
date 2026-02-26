import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import viteTsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const config = defineConfig({
  plugins: [
    devtools(),
    tanstackStart(),
    nitro({
      preset: 'node',
      plugins: [`${__dirname}server/plugins/sync.ts`],
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tailwindcss(),
    viteReact(),
  ],
  environments: {
    client: {
      build: {
        rollupOptions: {
          onwarn(warning, warn) {
            // Suppress node:stream externalization warnings
            if (
              warning.code === 'UNRESOLVED_IMPORT' &&
              typeof warning.exporter === 'string' &&
              warning.exporter.startsWith('node:')
            ) {
              return
            }
            warn(warning)
          },
          external: ['node:stream', 'node:stream/web', 'node:async_hooks'],
        },
      },
    },
  },
})

export default config
