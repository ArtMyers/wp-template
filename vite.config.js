import { defineConfig } from 'vite';
import concatPlugin from './vite/concat-plugin.js';
import bundles from './vite/bundles.js';

// Dev only: `bun run dev` watches sources and writes unminified bundles.
// Production bundles: `bun run build` (minified, see vite/build.js).
export default defineConfig({
  server: {
    watch: {
      usePolling: true,
      interval: 500,
    },
  },
  plugins: [concatPlugin({ bundles })],
});
