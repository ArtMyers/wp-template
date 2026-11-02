<?php
/**
 * Theme setup and assets.
 */

defined( 'ABSPATH' ) || exit;

define( 'MYERS_THEME_DIR', get_template_directory() );
define( 'MYERS_THEME_URI', get_template_directory_uri() );

/**
 * Version an asset by its modification time, so browsers pick up rebuilt files.
 */
function myers_theme_asset_version( string $relative_path ): ?string {
	$path = MYERS_THEME_DIR . '/' . $relative_path;
	return file_exists( $path ) ? (string) filemtime( $path ) : null;
}

add_action( 'after_setup_theme', function () {
	add_theme_support( 'title-tag' );
	add_theme_support( 'post-thumbnails' );
	add_theme_support( 'html5', [ 'search-form', 'comment-form', 'comment-list', 'gallery', 'caption', 'style', 'script' ] );

	register_nav_menus( [
		'primary' => __( 'Primary menu', 'myers-theme' ),
		'footer'  => __( 'Footer menu', 'myers-theme' ),
	] );
} );

add_action( 'wp_enqueue_scripts', function () {
	// CSS bundles are built from assets/css/pages by vite/bundles.js.
	// Add a bundle per page type there and enqueue it here by condition (is_front_page(), is_page(), ...).
	$css = 'assets/css/homepage.min.css';
	wp_enqueue_style( 'myers-theme', MYERS_THEME_URI . '/' . $css, [], myers_theme_asset_version( $css ) );

	$main = 'assets/js/main.js';
	wp_enqueue_script( 'myers-theme-main', MYERS_THEME_URI . '/' . $main, [], myers_theme_asset_version( $main ), [
		'strategy'  => 'defer',
		'in_footer' => true,
	] );

	// Alpine.js loads after main.js, so `alpine:init` listeners in main.js are registered in time.
	$alpine = 'assets/libs/cdn.min.js';
	wp_enqueue_script( 'alpinejs', MYERS_THEME_URI . '/' . $alpine, [ 'myers-theme-main' ], '3.15.12', [
		'strategy'  => 'defer',
		'in_footer' => true,
	] );
} );
