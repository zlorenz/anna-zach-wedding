<?php
/**
 * Child Theme Functions
 * ––––––––––––––––––––––––––––––––
 * Parent Theme: Anna & Zach Wedding
 * Template: anna-zach-wedding
 * Version: 1.0.0
 * Text Domain: anna-zach-wedding-child
 */

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

// Load Google Fonts
add_action('wp_enqueue_scripts', function () {
  wp_enqueue_style(
    'anna-zach-google-fonts',
    'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Raleway:wght@300;400;500;600&display=swap',
    [],
    null
  );
}, 5);

/**
 * Telegram notifications for Gravity Forms RSVP (Form ID: 1)
 * Sends to a Telegram group via Bot API on submission.
 */

function az_send_telegram_message(string $text): void {
  // Hard fail if constants truly aren't present
  if (!defined('AZ_TELEGRAM_BOT_TOKEN') || trim((string) AZ_TELEGRAM_BOT_TOKEN) === '') {
    error_log('[AZ Telegram] Bot token not set (AZ_TELEGRAM_BOT_TOKEN empty).');
    return;
  }

  if (!defined('AZ_TELEGRAM_CHAT_ID') || trim((string) AZ_TELEGRAM_CHAT_ID) === '') {
    error_log('[AZ Telegram] Chat ID not set (AZ_TELEGRAM_CHAT_ID empty).');
    return;
  }

  $url = 'https://api.telegram.org/bot' . AZ_TELEGRAM_BOT_TOKEN . '/sendMessage';

  $payload = [
    'chat_id' => AZ_TELEGRAM_CHAT_ID,
    'text'    => $text,
    'disable_web_page_preview' => true,
  ];

  error_log('[AZ Telegram] sending… tokenLen=' . strlen(AZ_TELEGRAM_BOT_TOKEN) . ' chat=' . AZ_TELEGRAM_CHAT_ID);

  $response = wp_remote_post($url, [
    'timeout' => 20,
    'headers' => ['Content-Type' => 'application/json; charset=utf-8'],
    'body'    => wp_json_encode($payload),
  ]);

  if (is_wp_error($response)) {
    error_log('[AZ Telegram] WP_Error: ' . $response->get_error_message());
    return;
  }

  $code = wp_remote_retrieve_response_code($response);
  $body = wp_remote_retrieve_body($response);

  error_log('[AZ Telegram] HTTP ' . $code . ' body: ' . $body);
}

/**
 * Helper: find a field ID by its LABEL (exact match).
 */
function az_gf_field_id_by_label(array $form, string $label): ?int {
  if (empty($form['fields']) || !is_array($form['fields'])) return null;

  foreach ($form['fields'] as $field) {
    // $field is a GF_Field object
    if (isset($field->label) && trim((string)$field->label) === $label) {
      return (int)$field->id;
    }
  }
  return null;
}

/**
 * Helper: get entry value by field label (string), returns '' if missing.
 */
function az_gf_entry_value(array $form, array $entry, string $label): string {
  $fid = az_gf_field_id_by_label($form, $label);
  if (!$fid) return '';
  $val = rgar($entry, (string)$fid);
  if (is_array($val)) $val = implode(', ', $val);
  return trim((string)$val);
}

/**
 * Helper: get full name from a GF "Name" field by label.
 * First name is input_{$id}.3 and last name is input_{$id}.6 in GF conventions.
 */
function az_gf_full_name_from_name_field(array $form, array $entry, string $name_label): string {
  $fid = az_gf_field_id_by_label($form, $name_label);
  if (!$fid) return '';

  $first = rgar($entry, $fid . '.3');
  $last  = rgar($entry, $fid . '.6');

  $full = trim(trim((string)$first) . ' ' . trim((string)$last));
  return $full;
}

/**
 * RSVP Telegram notification hook for Form ID 1.
 * Also appends a normalized row to Google Sheets (Apps Script Web App).
 */
add_action('gform_after_submission_1', function ($entry, $form) {

  // === EDIT THESE LABELS to match your form exactly ===
  $labels = [
    'invitee_name'        => 'Full Name',
    'invitee_email'       => 'Email',
    'attending'           => 'Will you be attending?',
    'invitee_dietary'     => 'Any food allergies or restrictions?',
    'decline_message'     => 'Optional Message',
    'joining'             => 'Will anyone be joining you?',
    'additional_guests'   => 'How many additional guests will come with you?',

    // Guest blocks (adjust if your labels differ)
    'g1_name'             => 'Guest 1: Name',
    'g1_agecat'           => 'Guest 1: Age',
    'g1_dietary'          => 'Guest 1: Food Allergies or Restrictions',

    'g2_name'             => 'Guest 2: Name',
    'g2_agecat'           => 'Guest 2: Age',
    'g2_dietary'          => 'Guest 2: Food Allergies or Restrictions',

    'g3_name'             => 'Guest 3: Name',
    'g3_agecat'           => 'Guest 3: Age',
    'g3_dietary'          => 'Guest 3: Food Allergies or Restrictions',
  ];

  $name  = az_gf_full_name_from_name_field($form, $entry, $labels['invitee_name']);
  if ($name === '') {
    // Fallback if you used a single-line field instead of Name field
    $name = az_gf_entry_value($form, $entry, $labels['invitee_name']);
  }

  $email     = az_gf_entry_value($form, $entry, $labels['invitee_email']);
  $attending = az_gf_entry_value($form, $entry, $labels['attending']);

  // Normalize attending values (since you used friendly labels)
  $is_yes = (stripos($attending, 'yes') !== false);

  // Common fields for Sheets
  $form_id  = (string) rgar($form, 'id');
  $entry_id = (string) rgar($entry, 'id');

  // Helpful request context
  $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
  $host   = $_SERVER['HTTP_HOST'] ?? 'localhost';
  $uri    = $_SERVER['REQUEST_URI'] ?? '/';
  $source_url = $scheme . '://' . $host . $uri;
  $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? (string) $_SERVER['HTTP_USER_AGENT'] : '';
  $user_agent = trim(preg_replace('/\s+/', ' ', $user_agent)); // normalize whitespace
  if (strlen($user_agent) > 120) $user_agent = substr($user_agent, 0, 120) . '…';

  // -------------------------
  // DECLINED
  // -------------------------
  if (!$is_yes) {
    $msg = az_gf_entry_value($form, $entry, $labels['decline_message']);
    if (strlen($msg) > 400) $msg = substr($msg, 0, 400);

    // Telegram
    $text =
      "🚫 RSVP Declined\n\n" .
      "👤 " . ($name ?: 'Unknown') . "\n" .
      "📧 " . ($email ?: '-') . "\n" .
      ($msg ? "\n💬 Message: " . $msg . "\n" : "");
    az_send_telegram_message($text);

    // Google Sheet
    az_append_rsvp_to_google_sheet([
      'form_id'       => $form_id,
      'entry_id'      => $entry_id,
      'status'        => 'DECLINED',
      'name'          => (string) ($name ?: ''),
      'email'         => (string) ($email ?: ''),
      'guest_count'   => '0',
      'message'       => (string) ($msg ?: ''),
      'dietary'       => '',
      'guests'        => '',
      'source_url'    => $source_url,
      'user_agent'    => $user_agent,
      'submitted_at'  => gmdate('c'),
    ]);

    return;
  }

  // -------------------------
  // ACCEPTED
  // -------------------------
  $joining = az_gf_entry_value($form, $entry, $labels['joining']);
  $addl    = az_gf_entry_value($form, $entry, $labels['additional_guests']);
  $diet    = az_gf_entry_value($form, $entry, $labels['invitee_dietary']);
  if ($diet === '') $diet = 'None';

  // Additional guests count (0..3)
  $addl_n = 0;
  if (stripos($joining, 'yes') !== false) {
    $addl_n = (int)$addl;
    if ($addl_n < 0) $addl_n = 0;
    if ($addl_n > 3) $addl_n = 3;
  }

  $lines = [];
  $lines[] = "🎉 RSVP Accepted";
  $lines[] = "";
  $lines[] = "👤 " . ($name ?: 'Unknown');
  $lines[] = "📧 " . ($email ?: '-');
  $lines[] = "";
  $lines[] = "🍽 Invitee Dietary: " . ($diet ?: 'None');
  $lines[] = "👥 Additional Guests: " . (string)$addl_n;

  // Build guest summaries for Sheets
  $guest_lines = [];
  $diet_lines  = [];
  $diet_lines[] = "Invitee: " . ($diet ?: 'None');

  if ($addl_n >= 1) {
    $g1n = az_gf_entry_value($form, $entry, $labels['g1_name']);
    $g1a = az_gf_entry_value($form, $entry, $labels['g1_agecat']);
    $g1d = az_gf_entry_value($form, $entry, $labels['g1_dietary']); if ($g1d === '') $g1d = 'None';

    $lines[] = "";
    $lines[] = "Guest 1: " . ($g1n ?: '-') . " | " . ($g1a ?: '-') . " | Dietary: " . ($g1d ?: 'None');

    $guest_lines[] = "G1 " . ($g1n ?: '-') . " (" . ($g1a ?: '-') . ")";
    $diet_lines[]  = "Guest 1: " . ($g1d ?: 'None');
  }
  if ($addl_n >= 2) {
    $g2n = az_gf_entry_value($form, $entry, $labels['g2_name']);
    $g2a = az_gf_entry_value($form, $entry, $labels['g2_agecat']);
    $g2d = az_gf_entry_value($form, $entry, $labels['g2_dietary']); if ($g2d === '') $g2d = 'None';

    $lines[] = "Guest 2: " . ($g2n ?: '-') . " | " . ($g2a ?: '-') . " | Dietary: " . ($g2d ?: 'None');

    $guest_lines[] = "G2 " . ($g2n ?: '-') . " (" . ($g2a ?: '-') . ")";
    $diet_lines[]  = "Guest 2: " . ($g2d ?: 'None');
  }
  if ($addl_n >= 3) {
    $g3n = az_gf_entry_value($form, $entry, $labels['g3_name']);
    $g3a = az_gf_entry_value($form, $entry, $labels['g3_agecat']);
    $guest_lines[] = "G3 " . ($g3n ?: '-') . " (" . ($g3a ?: '-') . ")";

    $lines[] = "Guest 3: " . ($g3n ?: '-') . " | " . ($g3a ?: '-') . " | Dietary: " . ($g3d ?: 'None');

    $guest_lines[] = "G3 " . ($g3n ?: '-') . " (" . ($g3a ?: '-') . ") - " . ($g3d ?: 'None');
    $diet_lines[]  = "Guest 3: " . ($g3d ?: 'None');
  }

  $text = implode("\n", $lines);
  az_send_telegram_message($text);

  // Sheet payload (keep fields short-ish)
  $dietary_summary = implode("\n", $diet_lines);
  $guests_summary  = implode("\n", $guest_lines);

  if (strlen($dietary_summary) > 450) $dietary_summary = substr($dietary_summary, 0, 450);
  if (strlen($guests_summary) > 450) $guests_summary = substr($guests_summary, 0, 450);

  $total_people = 1 + $addl_n;

  az_append_rsvp_to_google_sheet([
    'form_id'       => $form_id,
    'entry_id'      => $entry_id,
    'status'        => 'ACCEPTED',
    'name'          => (string) ($name ?: ''),
    'email'         => (string) ($email ?: ''),
    'guest_count'   => (string) $total_people,
    'message'       => '', // you can map an "optional message" field here if you have one for accepted
    'dietary'       => $dietary_summary,
    'guests'        => $guests_summary,
    'source_url'    => $source_url,
    'user_agent'    => $user_agent,
    'submitted_at'  => gmdate('c'),
  ]);

}, 10, 2);


/**
 * -----------------------------------------------------------------------------
 * Append RSVP Submission to Google Sheet (via Apps Script Web App)
 * -----------------------------------------------------------------------------
 * Gravity Forms → WordPress hook → HTTP GET (encoded query) → Apps Script doGet()
 * → appendRow() in Google Sheet.
 *
 * Notes:
 * - Uses shared secret (AZ_SHEETS_SECRET) for basic auth.
 * - Uses RFC3986 encoding to safely handle spaces/unicode/etc.
 * - Logs only errors (keeps debug.log clean).
 * -----------------------------------------------------------------------------
 */
function az_append_rsvp_to_google_sheet(array $data): void {
  if (!defined('AZ_SHEETS_WEBHOOK_URL') || !AZ_SHEETS_WEBHOOK_URL) {
    error_log('[AZ Sheets] Webhook URL not set.');
    return;
  }
  if (!defined('AZ_SHEETS_SECRET') || !AZ_SHEETS_SECRET) {
    error_log('[AZ Sheets] Secret not set.');
    return;
  }

  $params = $data;
  $params['secret'] = AZ_SHEETS_SECRET;

  foreach ($params as $k => $v) {
    if (is_array($v) || is_object($v)) $v = wp_json_encode($v);
    $v = (string) $v;
    if (strlen($v) > 500) $v = substr($v, 0, 500);
    $params[$k] = $v;
  }

  $query = http_build_query($params, '', '&', PHP_QUERY_RFC3986);
  $url   = rtrim(AZ_SHEETS_WEBHOOK_URL, '?') . '?' . $query;

  $response = wp_remote_get($url, [
    'timeout'     => 20,
    'redirection' => 5,
    'headers'     => ['Accept' => 'application/json'],
  ]);

  if (is_wp_error($response)) {
    error_log('[AZ Sheets] WP_Error: ' . $response->get_error_message());
    return;
  }

  $code = wp_remote_retrieve_response_code($response);
  $body = wp_remote_retrieve_body($response);

  if ($code < 200 || $code >= 300) {
    error_log('[AZ Sheets] HTTP ' . $code . ' body: ' . substr($body, 0, 300));
    return;
  }

  if (is_string($body) && strpos($body, '"ok":false') !== false) {
    error_log('[AZ Sheets] Response: ' . substr($body, 0, 300));
  }
}