# WordPress Dev Template

WordPress development environment powered by **FrankenPHP** + **Caddy** + **MySQL 8** + **Bun** + **Vite**.

## Quick Start

```bash
cp .env.example .env     # adjust HOST_UID/HOST_GID (`id -u`, `id -g`) if not 1000
docker compose up --build -d
```

On first run WordPress is downloaded, configured and installed automatically, and the custom
theme and plugin are activated. Open http://localhost:8080 (admin: `/wp-admin`, `admin` / `admin`
by default, see `.env`).

## Services

| Service   | URL                   | Description                                   |
|-----------|-----------------------|-----------------------------------------------|
| WordPress | http://localhost:8080 | FrankenPHP + Caddy                            |
| Adminer   | http://localhost:8081 | Database management                           |
| MySQL     | internal              | Database (performance-tuned for dev)          |
| Bun       | internal              | Runs `bun run dev`: watches and rebuilds CSS  |

Ports are bound to `127.0.0.1` only, so the site is not reachable from the local network.

## Project Structure

```
├── docker/
│   ├── caddy/
│   │   ├── Dockerfile        # FrankenPHP image with PHP extensions, runs as host UID
│   │   ├── Caddyfile         # Web server config
│   │   └── entrypoint.sh     # Auto-setup: WP download, config, install
│   └── bun/
│       └── Dockerfile        # Bun image
├── plugin/                   # Custom plugin (bind-mounted), business logic
│   ├── custom-core-plugin.php
│   └── includes/             # Every *.php here is loaded automatically
├── theme/                    # Custom theme (bind-mounted)
│   ├── style.css             # Theme header
│   ├── functions.php         # Theme setup, asset enqueueing
│   ├── header.php / footer.php / index.php
│   └── assets/
│       ├── css/pages/        # CSS sources (parts/ = shared pieces)
│       ├── js/main.js
│       └── libs/cdn.min.js   # Alpine.js 3.15.12
├── vite/
│   ├── bundles.js            # CSS bundles: output file + ordered list of sources
│   ├── concat.js             # Concatenation + Lightning CSS minification
│   ├── concat-plugin.js      # Vite plugin: rebuild bundles on change (dev)
│   ├── build.js              # Production build (minified)
│   └── theme-name.js         # Renames theme prefixes after THEME_NAME
├── data/                     # Local data, git-ignored (created on first run)
│   ├── wordpress/            # WordPress core, wp-config.php, uploads, debug.log
│   └── mysql/                # MySQL data directory
├── .env.example              # Configuration template (copy to .env)
└── docker-compose.yml
```

## CSS Bundles

Bundles are declared in `vite/bundles.js`. Each one concatenates source files in the given order
into a single file, e.g. `theme/assets/css/homepage.min.css`.

- `bun run dev` (started automatically by the `bun` service) — rebuilds affected bundles on every
  change, unminified for easier debugging.
- `bun run build` — builds all bundles minified. Run before deploying:
  `docker compose exec bun bun run build`.

Built `*.min.css` files are git-ignored. New bundles must also be enqueued in `theme/functions.php`.

## Configuration

Edit `.env` (created from `.env.example`):

```env
WORDPRESS_PORT=8080            # WordPress port
ADMINER_PORT=8081              # Adminer port
HOST_UID=1000                  # Containers write files as this user
HOST_GID=1000
DB_NAME=exampledb              # Database
DB_USER=exampleuser
DB_PASSWORD=examplepass
WP_URL=http://localhost:8080   # Auto-install settings (first run only)
WP_TITLE="WordPress Dev"
WP_ADMIN_USER=admin
WP_ADMIN_PASSWORD=admin
WP_ADMIN_EMAIL=admin@example.com
PLUGIN_FOLDER_NAME=custom-core-plugin   # Plugin directory name inside wp-content/plugins
THEME_FOLDER_NAME=custom-theme          # Theme directory name inside wp-content/themes
THEME_NAME=Custom Theme                 # Theme name, see "Theme Name" below
```

## Theme Name

`vite/theme-name.js` renames the theme after `THEME_NAME`. It reads the current name from the
`Theme Name:` header in `theme/style.css` and replaces every derived identifier in the theme's
`*.php`, `*.css` and `*.js` files (`assets/libs/` and `*.min.css` are skipped):

| `Custom Theme` → `My Shop` | Where                                  |
|----------------------------|----------------------------------------|
| `My Shop`                  | `Theme Name:` header                   |
| `my-shop`                  | Text domain, style/script handles      |
| `my_shop`                  | Function prefix (`my_shop_asset_version`) |
| `MY_SHOP`                  | Constant prefix (`MY_SHOP_DIR`)        |

It runs automatically before `bun run dev` and `bun run build` (does nothing if the name is
unchanged), or manually: `docker compose exec bun bun run theme-name`. Restart the `bun` service
after editing `.env`. Write new code with the current prefixes so it gets renamed too, and pick
a distinctive name: a single common word (e.g. `Main`) would also match unrelated text.

## What Happens on First Run

1. **WordPress core** is downloaded
2. **wp-config.php** is generated with:
   - Database connection
   - Debug mode (`WP_DEBUG`, `WP_DEBUG_LOG`, `SCRIPT_DEBUG`); errors are written to
     `wp-content/debug.log`, not printed into pages (`WP_DEBUG_DISPLAY=false`)
   - WP-Cron disabled (for performance)
   - File editor disabled (security)
   - Auto-updates disabled
   - Memory limits: 256M / 512M
3. The entrypoint waits for MySQL, runs `wp core install`, activates the theme and plugin and
   sets pretty permalinks (`/%postname%/`)

## Performance Optimizations

- **FrankenPHP**: Embedded PHP in Caddy — no PHP-FPM overhead
- **OPcache**: `revalidate_freq=0` — instant PHP file change detection
- **MySQL**: Tuned InnoDB buffers, disabled binary log & performance schema
- **Caddy**: zstd/gzip compression, no-cache headers for dev
- **tmpfs**: `/tmp` mounted in RAM for WordPress and MySQL

## Useful Commands

```bash
# WP-CLI inside the container (-u app: run as the host user, not root)
docker compose exec -u app wordpress wp plugin list
docker compose exec -u app wordpress wp theme list

# Run WP-Cron manually (since DISABLE_WP_CRON=true)
docker compose exec -u app wordpress wp cron event run --due-now

# Debug log
docker compose exec -u app wordpress tail -f /app/public/wp-content/debug.log

# Production CSS build
docker compose exec bun bun run build

# View logs
docker compose logs wordpress -f
docker compose logs bun -f

# Rebuild after Dockerfile changes
docker compose up --build -d

# Full reset (removes WordPress core, uploads and DB data in ./data)
# data/mysql belongs to the container's mysql user, hence sudo
docker compose down
sudo rm -rf data
docker compose up --build -d
```
