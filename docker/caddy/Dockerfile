FROM dunglas/frankenphp:1-php8.3-bookworm

ARG HOST_UID=1000
ARG HOST_GID=1000
ARG WP_CLI_VERSION=2.12.0

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    rsync \
    libcap2-bin \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    libxml2-dev \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions (install-php-extensions handles its own deps)
RUN install-php-extensions \
        pdo_mysql \
        mysqli \
        zip \
        intl \
        bcmath \
        opcache \
        pcntl \
        gd \
        exif

# Install WP-CLI
RUN curl -fsSL -o /usr/local/bin/wp \
        https://github.com/wp-cli/wp-cli/releases/download/v${WP_CLI_VERSION}/wp-cli-${WP_CLI_VERSION}.phar \
    && chmod +x /usr/local/bin/wp

# FrankenPHP image has no healthcheck endpoint with admin API off
HEALTHCHECK NONE

# ── OPcache config (dev-optimized) ──────────────────────────────────
RUN echo '\
opcache.enable=1\n\
opcache.memory_consumption=256\n\
opcache.interned_strings_buffer=32\n\
opcache.max_accelerated_files=20000\n\
opcache.revalidate_freq=0\n\
opcache.validate_timestamps=1\n\
opcache.save_comments=1\n\
opcache.enable_file_override=1\n\
opcache.jit=disable\n\
opcache.fast_shutdown=1\n\
' > /usr/local/etc/php/conf.d/opcache.ini

# ── PHP performance tuning ──────────────────────────────────────────
RUN echo '\
realpath_cache_size=4096K\n\
realpath_cache_ttl=600\n\
memory_limit=512M\n\
max_execution_time=60\n\
upload_max_filesize=64M\n\
post_max_size=64M\n\
' > /usr/local/etc/php/conf.d/performance.ini

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# ── Non-root user matching the host UID/GID ─────────────────────────
# Files created by WordPress in bind mounts (data/wordpress, theme/, plugin/) belong to the host user.
# The entrypoint starts as root, fixes ownership of mount points, then drops to this user.
RUN groupadd -g ${HOST_GID} app \
    && useradd -m -u ${HOST_UID} -g ${HOST_GID} -s /bin/bash app \
    && setcap CAP_NET_BIND_SERVICE=+eip /usr/local/bin/frankenphp \
    && mkdir -p /app/public \
    && chown -R app:app /app /config/caddy /data/caddy

WORKDIR /app

# Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
