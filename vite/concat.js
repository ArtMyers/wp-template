import { resolve } from 'path';
import { transform } from 'lightningcss';

/**
 * Concatenate files for a single bundle and write the output.
 * Uses Bun's native file API.
 *
 * @param {Object} bundle
 * @param {string} bundle.output     Output file path (relative to root)
 * @param {string[]} bundle.files    Input files in order (relative to root)
 * @param {string} [bundle.separator] Separator between files (default: '\n')
 * @param {string} root              Project root
 * @param {Object} [options]
 * @param {boolean} [options.minify] Minify the result with Lightning CSS
 */
export async function buildBundle(bundle, root, { minify = false } = {}) {
  const { output, files, separator = '\n' } = bundle;
  const outputPath = resolve(root, output);

  const contents = await Promise.all(
    files.map(async (file) => {
      const bunFile = Bun.file(resolve(root, file));
      if (!(await bunFile.exists())) {
        console.warn(`[concat] File not found: ${file}`);
        return `/* File not found: ${file} */`;
      }
      return bunFile.text();
    })
  );

  let result = contents.join(separator);

  if (minify) {
    const { code } = transform({
      filename: output,
      code: Buffer.from(result),
      minify: true,
    });
    result = new TextDecoder().decode(code);
  }

  // Bun.write automatically creates parent directories
  await Bun.write(outputPath, result);
  console.log(`[concat] Built: ${output} (${files.length} files${minify ? ', minified' : ''})`);
}

/**
 * Build all bundles. Errors are logged per bundle; returns false if any failed.
 */
export async function buildAll(bundles, root, options) {
  const results = await Promise.allSettled(
    bundles.map((bundle) => buildBundle(bundle, root, options))
  );

  let ok = true;
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      ok = false;
      console.error(`[concat] Failed: ${bundles[i].output}\n`, r.reason);
    }
  });
  return ok;
}
