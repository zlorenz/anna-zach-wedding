<?php

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

