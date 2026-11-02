import bundles from './bundles.js';
import { buildAll } from './concat.js';

const root = new URL('..', import.meta.url).pathname;

const ok = await buildAll(bundles, root, { minify: true });
process.exit(ok ? 0 : 1);
