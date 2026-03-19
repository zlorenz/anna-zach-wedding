<?php

// --- Disable comments site-wide (wedding site) ---
add_action('init', function () {
  // Remove comment support from all post types
  foreach (get_post_types() as $post_type) {
    if (post_type_supports($post_type, 'comments')) {
      remove_post_type_support($post_type, 'comments');
      remove_post_type_support($post_type, 'trackbacks');
    }
  }
});

// Always close comments/pings
add_filter('comments_open', '__return_false', 20, 2);
add_filter('pings_open', '__return_false', 20, 2);

// Hide existing comments
add_filter('comments_array', '__return_empty_array', 10, 2);

// Remove Comments menu + admin bar item
add_action('admin_menu', function () {
  remove_menu_page('edit-comments.php');
});

add_action('admin_bar_menu', function ($wp_admin_bar) {
  $wp_admin_bar->remove_node('comments');
}, 999);

// Redirect away from the comments page if someone hits it
add_action('admin_init', function () {
  global $pagenow;
  if ($pagenow === 'edit-comments.php') {
    wp_safe_redirect(admin_url());
    exit;
  }

  // Remove dashboard "Recent Comments"
  remove_meta_box('dashboard_recent_comments', 'dashboard', 'normal');
});

