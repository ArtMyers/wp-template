import { resolve, relative } from 'path';

/**
 * Vite plugin for concatenating files in a specified order.
 * Uses Bun's native file API.
 *
 * @param {Object} options
 * @param {Array<Object>} options.bundles - Array of bundle configurations.
 *   Each bundle is an object:
 *   {
 *     output: string,    // Output file path (relative to project root)
 *     files: string[],   // Input files in order (relative to project root)
 *     separator: string,  // Optional separator between files (default: '\n')
 *   }
 *
 * @example
 * concatPlugin({
 *   bundles: [
 *     {
 *       output: 'theme/assets/css/homepage.min.css',
 *       files: [
 *         'theme/assets/css/pages/parts/reset.css',
 *         'theme/assets/css/pages/parts/fonts.css',
 *         'theme/assets/css/pages/parts/global.css',
 *         'theme/assets/css/pages/parts/header.css',
 *         'theme/assets/css/pages/parts/footer.css',
 *         'theme/assets/css/pages/homepage.css',
 *       ],
 *     },
 *   ],
 * })
 */
export default function concatPlugin(options = {}) {
  const { bundles = [] } = options;
  let root = '';

  /**
   * Resolve a path relative to the project root.
   */
  function resolvePath(filePath) {
    return resolve(root, filePath);
  }

  /**
   * Concatenate files for a single bundle and write the output.
   */
  async function buildBundle(bundle) {
    const { output, files, separator = '\n' } = bundle;
    const outputPath = resolvePath(output);

    const contents = await Promise.all(
      files.map(async (file) => {
        const bunFile = Bun.file(resolvePath(file));
        if (!(await bunFile.exists())) {
          console.warn(`[concat-plugin] File not found: ${file}`);
          return `/* File not found: ${file} */`;
        }
        return bunFile.text();
      })
    );

    const result = contents.join(separator);

    // Bun.write automatically creates parent directories
    await Bun.write(outputPath, result);
    console.log(`[concat-plugin] Built: ${output} (${files.length} files)`);
  }

  /**
   * Build all bundles.
   */
  async function buildAll() {
    await Promise.all(bundles.map(buildBundle));
  }

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
      await buildAll();
    },

    // Watch source files and rebuild affected bundles on change
    configureServer(server) {
      // Collect all output paths to exclude from triggering rebuilds
      const outputPaths = new Set(
        bundles.map((b) => resolvePath(b.output))
      );

      // Collect all input files to watch
      const watchedFiles = new Set();
      for (const bundle of bundles) {
        for (const file of bundle.files) {
          watchedFiles.add(resolvePath(file));
        }
      }

      // Add files to watcher
      for (const file of watchedFiles) {
        server.watcher.add(file);
      }

      server.watcher.on('change', (changedFile) => {
        const normalized = resolve(changedFile);

        // Skip if the changed file is an output file
        if (outputPaths.has(normalized)) return;

        const affected = findAffectedBundles(normalized);

        if (affected.length > 0) {
          console.log(`[concat-plugin] Change detected: ${relative(root, normalized)}`);
          Promise.all(affected.map(buildBundle));
        }
      });
    },
  };
}
