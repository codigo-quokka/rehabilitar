import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const allowedHosts = ['localhost']
  const VITE_TUNNEL_HOST = env.VITE_TUNNEL_HOST
  if (VITE_TUNNEL_HOST) {
    allowedHosts.push(VITE_TUNNEL_HOST)
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts
    }
  }
})

/*
  Note: loadEnv vs import.meta.env

  - loadEnv(mode, process.cwd(), '') reads .env files at build/start time
    (useful in config files or server-side code where you need env values
    before the dev server starts). It returns a plain object.

  - import.meta.env is Vite's runtime env object available in client code
    (and config too after bundling). Only variables prefixed with
    VITE_ are exposed to the client; others remain server-only.

  Use loadEnv in vite.config.ts to configure the dev server or plugins,
  and use import.meta.env inside application source code.
*/