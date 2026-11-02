import { resolve, relative } from 'path';
import { buildAll } from './concat.js';

/**
 * Vite plugin that concatenates files in a specified order
 * and rebuilds affected bundles when a source file changes.
 *
 * @param {Object} options
 * @param {Array<Object>} options.bundles - Bundle configs, see vite/bundles.js
 * @param {boolean} [options.minify]      - Minify output (default: false in dev)
 */
export default function concatPlugin(options = {}) {
  const { bundles = [], minify = false } = options;
  let root = '';

  /**
   * Find which bundles contain a given file path.
   */
  function findAffectedBundles(changedFile) {
    const rel = relative(root, changedFile).replace(/\\/g, '/');
    return bundles.filter((bundle) =>
      bundle.files.some((f) => f.replace(/\\/g, '/') === rel)
    );
  }

  return {
    name: 'vite-plugin-concat',

    configResolved(config) {
      root = config.root;
    },

    // Build all bundles on server start
    async buildStart() {
      await buildAll(bundles, root, { minify });
    },

    // Watch source files and rebuild affected bundles on change
    configureServer(server) {
      const outputPaths = new Set(bundles.map((b) => resolve(root, b.output)));

      for (const bundle of bundles) {
        for (const file of bundle.files) {
          server.watcher.add(resolve(root, file));
        }
      }

      // 'add' / 'unlink' cover files created or deleted after start
      for (const event of ['change', 'add', 'unlink']) {
        server.watcher.on(event, (changedFile) => {
          const normalized = resolve(changedFile);

          // Skip if the changed file is an output file
          if (outputPaths.has(normalized)) return;

          const affected = findAffectedBundles(normalized);
          if (affected.length === 0) return;

          console.log(`[concat] ${event}: ${relative(root, normalized)}`);
          buildAll(affected, root, { minify });
        });
      }
    },
  };
}
