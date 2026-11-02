import { resolve } from 'path';

/**
 * Renames the theme after THEME_NAME from .env (Bun loads .env automatically).
 *
 * The current name is read from the `Theme Name:` header in theme/style.css, and every
 * derived identifier is replaced in theme sources:
 *   "Custom Theme" -> Theme Name header
 *   custom-theme   -> text domain, script/style handles
 *   custom_theme   -> function names
 *   CUSTOM_THEME   -> constants
 *
 * Runs before `bun run dev` / `bun run build`; does nothing if the name hasn't changed.
 */

const root = new URL('..', import.meta.url).pathname;
const themeDir = resolve(root, 'theme');
const headerRe = /^([ \t]*Theme Name:[ \t]*)(.+)$/m;

function variants(name) {
  const words = name.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  const slug = words.join('-');
  const snake = words.join('_');
  return { title: name.trim(), slug, snake, constant: snake.toUpperCase() };
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const newName = (process.env.THEME_NAME ?? '').trim();
if (!newName) {
  console.log('[theme-name] THEME_NAME is not set in .env, skipping');
  process.exit(0);
}

const next = variants(newName);
if (!/^[a-z]/.test(next.slug)) {
  console.error(`[theme-name] THEME_NAME "${newName}" must start with a latin letter (a-z)`);
  process.exit(1);
}

const styleFile = Bun.file(resolve(themeDir, 'style.css'));
const currentName = (await styleFile.text()).match(headerRe)?.[2].trim();
if (!currentName) {
  console.error('[theme-name] "Theme Name:" header not found in theme/style.css');
  process.exit(1);
}

const prev = variants(currentName);
if (prev.title === next.title && prev.slug === next.slug) {
  process.exit(0);
}

// Longest identifiers first; letters/digits around a match mean it's part of another word.
const replacements = [
  [prev.constant, next.constant],
  [prev.snake, next.snake],
  [prev.slug, next.slug],
].map(([from, to]) => [new RegExp(`(?<![A-Za-z0-9])${escapeRe(from)}(?![A-Za-z0-9])`, 'g'), to]);

const glob = new Bun.Glob('**/*.{php,css,js}');
let changed = 0;

for await (const rel of glob.scan({ cwd: themeDir })) {
  // Vendor libraries and build output are not ours to rename.
  if (rel.startsWith('assets/libs/') || rel.endsWith('.min.css')) continue;

  const path = resolve(themeDir, rel);
  const source = await Bun.file(path).text();
  let result = source;

  if (rel === 'style.css') {
    result = result.replace(headerRe, `$1${next.title}`);
  }
  for (const [re, to] of replacements) {
    result = result.replace(re, to);
  }

  if (result !== source) {
    await Bun.write(path, result);
    changed++;
    console.log(`[theme-name] Updated: theme/${rel}`);
  }
}

console.log(`[theme-name] "${prev.title}" -> "${next.title}" (${changed} files)`);
