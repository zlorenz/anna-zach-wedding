<?php
/**
 * Child Theme Functions
 * ––––––––––––––––––––––––––––––––
 * Parent Theme: Anna & Zach Wedding
 * Template: anna-zach-wedding
 * Version: 1.0.0
 * Text Domain: anna-zach-wedding-child
 */

// Theme setup (loaded first for consistency)
require_once __DIR__ . '/inc/setup.php';
require_once __DIR__ . '/inc/enqueue.php';
require_once __DIR__ . '/inc/comments.php';

// Gravity Forms RSVP integration (Telegram + Google Sheets)
require_once __DIR__ . '/inc/gravity-forms/telegram.php';
require_once __DIR__ . '/inc/gravity-forms/google-sheets.php';
require_once __DIR__ . '/inc/gravity-forms/rsvp-hooks.php';