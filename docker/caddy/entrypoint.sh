#!/bin/sh
set -e

WP_PATH=/app/public

# Started as root: fix ownership of directories Docker created for bind mounts
# (data/wordpress, wp-content/{plugins,themes}), then re-run this script as `app`.
if [ "$(id -u)" = "0" ]; then
    mkdir -p "$WP_PATH/wp-content/plugins" "$WP_PATH/wp-content/themes"
    chown app:app "$WP_PATH" "$WP_PATH/wp-content" "$WP_PATH/wp-content/plugins" "$WP_PATH/wp-content/themes"
    export HOME=/home/app
    exec setpriv --reuid=app --regid=app --init-groups "$0" "$@"
fi

wpc() {
    wp --path="$WP_PATH" "$@"
}

# WordPress auto-download
if [ ! -f "$WP_PATH/wp-settings.php" ]; then
    echo "⬇️ WordPress not found in $WP_PATH. Downloading..."
    wpc core download --force
    echo "✅ WordPress downloaded"
fi

# Create wp-config.php if missing
if [ ! -f "$WP_PATH/wp-config.php" ]; then
    echo "⚙️ wp-config.php not found. Creating..."
    wpc config create \
        --dbname="${WORDPRESS_DB_NAME:-exampledb}" \
        --dbuser="${WORDPRESS_DB_USER:-exampleuser}" \
        --dbpass="${WORDPRESS_DB_PASSWORD:-examplepass}" \
        --dbhost="${WORDPRESS_DB_HOST:-db}" \
        --skip-check

    echo "🔧 Injecting dev constants into wp-config.php..."

    # Development debug (errors go to wp-content/debug.log, not into HTML/REST responses)
    wpc config set WP_DEBUG true --raw
    wpc config set WP_DEBUG_LOG true --raw
    wpc config set WP_DEBUG_DISPLAY false --raw
    wpc config set SCRIPT_DEBUG true --raw

    # Performance
    wpc config set DISABLE_WP_CRON true --raw

    # Security
    wpc config set DISALLOW_FILE_EDIT true --raw

    # Disable auto-updates in dev
    wpc config set AUTOMATIC_UPDATER_DISABLED true --raw
    wpc config set WP_AUTO_UPDATE_CORE false --raw

    # Memory limits
    wpc config set WP_MEMORY_LIMIT '256M'
    wpc config set WP_MAX_MEMORY_LIMIT '512M'

    echo "✅ wp-config.php created with dev constants"
fi

# Wait for the database (depends_on healthcheck covers most cases, this is a safety net)
echo "⏳ Waiting for database..."
i=0
until php -r '
    mysqli_report(MYSQLI_REPORT_OFF);
    $c = @mysqli_connect(getenv("WORDPRESS_DB_HOST"), getenv("WORDPRESS_DB_USER"), getenv("WORDPRESS_DB_PASSWORD"), getenv("WORDPRESS_DB_NAME"));
    exit($c ? 0 : 1);
'; do
    i=$((i + 1))
    if [ "$i" -ge 60 ]; then
        echo "❌ Database is not reachable after 60s"
        exit 1
    fi
    sleep 1
done

# Install WordPress and activate the custom theme/plugin on first run
if ! wpc core is-installed 2>/dev/null; then
    echo "📦 Installing WordPress..."
    wpc core install \
        --url="${WP_URL:-http://localhost:8080}" \
        --title="${WP_TITLE:-WordPress Dev}" \
        --admin_user="${WP_ADMIN_USER:-admin}" \
        --admin_password="${WP_ADMIN_PASSWORD:-admin}" \
        --admin_email="${WP_ADMIN_EMAIL:-admin@example.com}" \
        --skip-email

    if [ -n "$THEME_FOLDER_NAME" ]; then
        wpc theme activate "$THEME_FOLDER_NAME" || echo "⚠️ Could not activate theme $THEME_FOLDER_NAME"
    fi
    if [ -n "$PLUGIN_FOLDER_NAME" ]; then
        wpc plugin activate "$PLUGIN_FOLDER_NAME" || echo "⚠️ Could not activate plugin $PLUGIN_FOLDER_NAME"
    fi

    wpc rewrite structure '/%postname%/'

    echo "✅ WordPress installed: ${WP_URL:-http://localhost:8080} (${WP_ADMIN_USER:-admin} / ${WP_ADMIN_PASSWORD:-admin})"
fi

exec "$@"
