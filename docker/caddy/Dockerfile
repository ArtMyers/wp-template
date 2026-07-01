FROM dunglas/frankenphp:latest-php8.3-bookworm

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    rsync \
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
RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar \
    && chmod +x wp-cli.phar \
    && mv wp-cli.phar /usr/local/bin/wp

# Disable default healthcheck if admin API is off
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
' > /usr/local/etc/php/conf.d/performance.ini

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Caddyfile
COPY Caddyfile /etc/caddy/Caddyfile

# Entrypoint script
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["frankenphp", "run", "--config", "/etc/caddy/Caddyfile"]
