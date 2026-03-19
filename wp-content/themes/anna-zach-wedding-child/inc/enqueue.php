<?php

add_action('wp_enqueue_scripts', function () {
  // Load parent stylesheet (the compiled Bootstrap theme CSS)
  wp_enqueue_style(
    'anna-zach-parent',
    get_template_directory_uri() . '/build/main.css',
    [],
    filemtime(get_template_directory() . '/build/main.css')
  );

  // Load child stylesheet (your overrides)
  $child_css = get_stylesheet_directory() . '/style.css';
  wp_enqueue_style(
    'anna-zach-child',
    get_stylesheet_uri(),
    ['anna-zach-parent'],
    file_exists($child_css) ? filemtime($child_css) : '1.0.0'
  );
}, 20);

// Load Google Fonts
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'anna-zach-google-fonts',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Raleway:wght@300;400;500;600&display=swap',
    [],
    null
  );
}, 5);

