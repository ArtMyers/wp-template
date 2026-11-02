<?php
/**
 * Plugin Name: Custom Core Plugin
 * Description: Project business logic: post types, taxonomies, integrations. Keep it theme-independent.
 * Version: 1.0.0
 * Requires at least: 6.3
 * Requires PHP: 8.1
 * Text Domain: custom-core-plugin
 */

defined( 'ABSPATH' ) || exit;

define( 'CUSTOM_CORE_PLUGIN_FILE', __FILE__ );
define( 'CUSTOM_CORE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'CUSTOM_CORE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

// Every PHP file in includes/ is loaded automatically (alphabetical order).
foreach ( glob( CUSTOM_CORE_PLUGIN_DIR . 'includes/*.php' ) ?: [] as $file ) {
	require_once $file;
}
