<?php

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

