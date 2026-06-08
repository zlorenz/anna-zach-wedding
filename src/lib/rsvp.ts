/**
 * RSVP submission handler — ports WordPress Gravity Forms integration
 * (Telegram + Google Sheets via Apps Script + guest confirmation email).
 */

import { sendRsvpConfirmationEmail } from './rsvp-email';

export type RsvpPayload = {
  firstName: string;
  lastName: string;
  email: string;
  attending: string;
  dietary?: string;
  declineMessage?: string;
  joining?: string;
  additionalGuests?: string;
  guests?: Array<{ name: string; age: string; dietary: string }>;
  honeypot?: string;
  sourceUrl?: string;
  userAgent?: string;
};

function env(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() || '';
}

export async function sendTelegramMessage(text: string): Promise<void> {
  const token = env('AZ_TELEGRAM_BOT_TOKEN');
  const chatId = env('AZ_TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });
  if (!res.ok) {
    console.error('[AZ Telegram] HTTP', res.status, await res.text());
  }
}

export async function appendRsvpToGoogleSheet(data: Record<string, string>): Promise<void> {
  const webhook = env('AZ_SHEETS_WEBHOOK_URL');
  const secret = env('AZ_SHEETS_SECRET');
  if (!webhook || !secret) {
    console.error('[AZ Sheets] Webhook URL or secret not set.');
    return;
  }

  const params: Record<string, string> = { ...data, secret };
  for (const [k, v] of Object.entries(params)) {
    let s = String(v);
    if (s.length > 500) s = s.slice(0, 500);
    params[k] = s;
  }

  const query = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
  const url = `${webhook.replace(/\?$/, '')}?${query}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(20_000),
  });
  const body = await res.text();
  if (!res.ok) {
    console.error('[AZ Sheets] HTTP', res.status, body.slice(0, 300));
    return;
  }
  if (body.includes('"ok":false')) {
    console.error('[AZ Sheets] Response:', body.slice(0, 300));
  }
}

export async function processRsvpSubmission(payload: RsvpPayload): Promise<{ ok: true } | { ok: false; error: string }> {
  if (payload.honeypot?.trim()) {
    return { ok: true };
  }

  const name = `${payload.firstName} ${payload.lastName}`.trim() || 'Unknown';
  const email = payload.email.trim();
  const attending = payload.attending.trim();
  if (!attending) {
    return { ok: false, error: 'Please choose whether you will be attending.' };
  }
  const isYes = /yes/i.test(attending);

  const sourceUrl = payload.sourceUrl || '';
  let userAgent = (payload.userAgent || '').replace(/\s+/g, ' ').trim();
  if (userAgent.length > 120) userAgent = userAgent.slice(0, 120) + '…';

  const formId = '1';
  const entryId = String(Date.now());

  if (!isYes) {
    let msg = (payload.declineMessage || '').trim();
    if (msg.length > 400) msg = msg.slice(0, 400);

    await sendTelegramMessage(
      `🚫 RSVP Declined\n\n👤 ${name}\n📧 ${email || '-'}\n${msg ? `\n💬 Message: ${msg}\n` : ''}`
    );

    await appendRsvpToGoogleSheet({
      form_id: formId,
      entry_id: entryId,
      status: 'DECLINED',
      name,
      email,
      guest_count: '0',
      message: msg,
      dietary: '',
      guests: '',
      source_url: sourceUrl,
      user_agent: userAgent,
      submitted_at: new Date().toISOString(),
    });

    queueRsvpConfirmationEmail({
      firstName: payload.firstName.trim(),
      name,
      email,
      isYes: false,
      addlGuestCount: 0,
      guests: [],
    });

    return { ok: true };
  }

  const joining = (payload.joining || '').trim();
  let addlN = 0;
  if (/yes/i.test(joining)) {
    addlN = Math.min(3, Math.max(0, parseInt(payload.additionalGuests || '0', 10) || 0));
  }

  const diet = (payload.dietary || '').trim() || 'None';
  const guests = payload.guests || [];

  const lines = [
    '🎉 RSVP Accepted',
    '',
    `👤 ${name}`,
    `📧 ${email || '-'}`,
    '',
    `🍽 Invitee Dietary: ${diet}`,
    `👥 Additional Guests: ${addlN}`,
  ];

  const guestLines: string[] = [];
  const dietLines: string[] = [`Invitee: ${diet}`];

  for (let i = 0; i < addlN; i++) {
    const g = guests[i] || { name: '', age: '', dietary: '' };
    const gn = g.name.trim() || '-';
    const ga = g.age.trim() || '-';
    const gd = g.dietary.trim() || 'None';
    lines.push('');
    lines.push(`Guest ${i + 1}: ${gn} | ${ga} | Dietary: ${gd}`);
    guestLines.push(`G${i + 1} ${gn} (${ga})`);
    dietLines.push(`Guest ${i + 1}: ${gd}`);
  }

  await sendTelegramMessage(lines.join('\n'));

  let dietarySummary = dietLines.join('\n');
  let guestsSummary = guestLines.join('\n');
  if (dietarySummary.length > 450) dietarySummary = dietarySummary.slice(0, 450);
  if (guestsSummary.length > 450) guestsSummary = guestsSummary.slice(0, 450);

  await appendRsvpToGoogleSheet({
    form_id: formId,
    entry_id: entryId,
    status: 'ACCEPTED',
    name,
    email,
    guest_count: String(1 + addlN),
    message: '',
    dietary: dietarySummary,
    guests: guestsSummary,
    source_url: sourceUrl,
    user_agent: userAgent,
    submitted_at: new Date().toISOString(),
  });

  queueRsvpConfirmationEmail({
    firstName: payload.firstName.trim(),
    name,
    email,
    isYes: true,
    dietary: diet,
    addlGuestCount: addlN,
    guests,
  });

  return { ok: true };
}

function queueRsvpConfirmationEmail(
  ctx: Parameters<typeof sendRsvpConfirmationEmail>[0]
): void {
  void sendRsvpConfirmationEmail(ctx).catch((err) => {
    console.error('[AZ Email]', err);
  });
}
