#!/bin/sh
set -e

# WordPress auto-download
if [ ! -f /app/public/wp-settings.php ]; then
    echo "⬇️ WordPress not found in /app/public. Downloading..."
    wp core download --path=/app/public --allow-root --force
    echo "✅ WordPress downloaded"
fi

# Create wp-config.php if missing
if [ ! -f /app/public/wp-config.php ]; then
    echo "⚙️ wp-config.php not found. Creating..."
    wp config create \
        --path=/app/public \
        --allow-root \
        --dbname="${WORDPRESS_DB_NAME:-exampledb}" \
        --dbuser="${WORDPRESS_DB_USER:-exampleuser}" \
        --dbpass="${WORDPRESS_DB_PASSWORD:-examplepass}" \
        --dbhost="${WORDPRESS_DB_HOST:-db}" \
        --skip-check

    echo "🔧 Injecting dev constants into wp-config.php..."

    # Development debug
    wp config set WP_DEBUG true --raw --path=/app/public --allow-root
    wp config set WP_DEBUG_LOG true --raw --path=/app/public --allow-root
    wp config set WP_DEBUG_DISPLAY true --raw --path=/app/public --allow-root
    wp config set SCRIPT_DEBUG true --raw --path=/app/public --allow-root


    # Performance
    wp config set DISABLE_WP_CRON true --raw --path=/app/public --allow-root
    wp config set CONCATENATE_SCRIPTS true --raw --path=/app/public --allow-root

    # Security
    wp config set DISALLOW_FILE_EDIT true --raw --path=/app/public --allow-root

    # Disable auto-updates in dev
    wp config set AUTOMATIC_UPDATER_DISABLED true --raw --path=/app/public --allow-root
    wp config set WP_AUTO_UPDATE_CORE false --raw --path=/app/public --allow-root

    # Memory limits
    wp config set WP_MEMORY_LIMIT '256M' --path=/app/public --allow-root
    wp config set WP_MAX_MEMORY_LIMIT '512M' --path=/app/public --allow-root

    echo "✅ wp-config.php created with dev constants"
fi



exec "$@"
