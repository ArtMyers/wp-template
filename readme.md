# WordPress Dev Template

WordPress development environment powered by **FrankenPHP** + **Caddy** + **MySQL 8** + **Bun** + **Vite**.

## Quick Start

```bash
docker compose up --build -d
```

Open http://localhost:8080 and complete the WordPress installation wizard.

## Services

| Service   | URL                  | Description                          |
|-----------|----------------------|--------------------------------------|
| WordPress | http://localhost:8080 | FrankenPHP + Caddy                   |
| Adminer   | http://localhost:8081 | Database management                  |
| MySQL     | internal             | Database (performance-tuned for dev) |
| Bun       | internal             | Vite / asset building                |

## Project Structure

```
├── docker/
│   ├── caddy/
│   │   ├── Dockerfile        # FrankenPHP image with PHP extensions
│   │   ├── Caddyfile         # Web server config
│   │   └── entrypoint.sh     # Auto-setup: WP download, config
│   └── bun/
│       └── Dockerfile        # Bun + Vite image
├── plugin/                   # Your custom plugin (bind-mounted)
├── theme/                    # Your custom theme (bind-mounted)
├── vite/                     # Frontend build tools
├── .env                      # Configuration
└── docker-compose.yml
```

## Configuration

Edit `.env` to customize:

```env
WORDPRESS_PORT=8080         # WordPress port
PHPMYADMIN_PORT=8081        # Adminer port
DB_NAME=exampledb           # Database name
DB_USER=exampleuser         # Database user
DB_PASSWORD=examplepass     # Database password
PLUGIN_FOLDER_NAME=custom-core-plugin   # Plugin directory name
THEME_FOLDER_NAME=custom-theme          # Theme directory name
```

## What Happens on First Run

1. **WordPress core** is auto-downloaded
2. **wp-config.php** is auto-generated with:
   - Database connection
   - Debug mode enabled (`WP_DEBUG`, `WP_DEBUG_LOG`, `SCRIPT_DEBUG`)
   - WP-Cron disabled (for performance)
   - File editor disabled (security)
   - Auto-updates disabled
   - Memory limits: 256M / 512M

## Performance Optimizations

- **FrankenPHP**: Embedded PHP in Caddy — no PHP-FPM overhead
- **OPcache**: `revalidate_freq=0` — instant PHP file change detection
- **MySQL**: Tuned InnoDB buffers, disabled binary log & performance schema
- **Caddy**: zstd/gzip compression, no-cache headers for dev
- **tmpfs**: `/tmp` mounted in RAM for WordPress and MySQL

## Useful Commands

```bash
# WP-CLI inside the container
docker compose exec wordpress wp plugin list --allow-root
docker compose exec wordpress wp theme list --allow-root

# Run WP-Cron manually (since DISABLE_WP_CRON=true)
docker compose exec wordpress wp cron event run --due-now --allow-root

# Bun container
docker compose exec bun sh

# View logs
docker compose logs wordpress -f

# Rebuild after Dockerfile changes
docker compose up --build -d

# Full reset (removes DB data)
docker compose down -v
docker compose up --build -d
```
