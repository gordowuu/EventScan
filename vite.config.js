import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],

  // Use public folder for static assets that need to be served as-is
  publicDir: 'public',

  build: {
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
      },
    },
  },

  server: {
    port: 3000,
    open: true,
  },

  preview: {
    port: 4173,
  },
})
