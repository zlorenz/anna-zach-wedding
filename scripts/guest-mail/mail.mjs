/**
 * Shared reminder-email rendering and Resend sending.
 * No network calls happen unless sendOne or sendBatch is invoked.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const REPLY_TO = 'zglorenz@gmail.com';
export const VERIFIED_FROM = 'Anna & Zach <rsvp@annaandzach.love>';

export function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const i = trimmed.indexOf('=');
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

export function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function fill(template, values) {
  let out = template;
  for (const [key, value] of Object.entries(values)) {
    out = out.replaceAll(`{{${key}}}`, value);
  }
  if (out.includes('{{')) {
    throw new Error('Unreplaced placeholder left in rendered email.');
  }
  return out;
}

export function subjectFor(subjects, lang) {
  const line = subjects
    .split('\n')
    .find((row) => row.startsWith(`[${lang}] Subject:`));
  if (!line) throw new Error(`Missing [${lang}] Subject in subjects.txt`);
  const subject = line.replace(`[${lang}] Subject:`, '').trim();
  if (!subject) throw new Error(`Empty [${lang}] subject`);
  return subject;
}

export function fromAddress() {
  const raw = process.env.AZ_RSVP_EMAIL_FROM || '';
  const match = raw.match(/<([^>]+)>/) || raw.match(/([^\s<>]+@[^\s<>]+)/);
  const email = match?.[1] || '';
  if (email.toLowerCase().endsWith('@annaandzach.love')) {
    return `Anna & Zach <${email}>`;
  }
  return VERIFIED_FROM;
}

export function loadKit(outDir) {
  const subjects = readFileSync(resolve(outDir, 'subjects.txt'), 'utf8');
  return {
    en: {
      html: readFileSync(resolve(outDir, 'reminder_en.html'), 'utf8'),
      text: readFileSync(resolve(outDir, 'reminder_en.txt'), 'utf8'),
      subject: subjectFor(subjects, 'EN'),
    },
    ru: {
      html: readFileSync(resolve(outDir, 'reminder_ru.html'), 'utf8'),
      text: readFileSync(resolve(outDir, 'reminder_ru.txt'), 'utf8'),
      subject: subjectFor(subjects, 'RU'),
    },
  };
}

export function renderReminder(kit, { lang, firstName, guestCount }) {
  const pack = kit[lang];
  if (!pack) throw new Error(`No template for language "${lang}".`);
  const values = {
    first_name: escapeHtml(firstName),
    guest_count: escapeHtml(String(guestCount)),
  };
  return {
    subject: pack.subject,
    html: fill(pack.html, values),
    text: fill(pack.text, values),
  };
}

function emailPayload(message) {
  if (!Array.isArray(message.to) || message.to.length !== 1) {
    throw new Error('Each email must have exactly one recipient.');
  }
  const payload = {
    from: message.from,
    to: message.to,
    reply_to: message.reply_to || REPLY_TO,
    subject: message.subject,
    html: message.html,
    text: message.text,
  };
  if (message.headers) payload.headers = message.headers;
  return payload;
}

async function postResend(path, apiKey, body, extraHeaders = {}) {
  const res = await fetch(`https://api.resend.com${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`Resend HTTP ${res.status}: ${raw.slice(0, 300)}`);
  }
  return JSON.parse(raw);
}

export async function sendOne({ apiKey, message }) {
  const parsed = await postResend('/emails', apiKey, emailPayload(message));
  if (!parsed.id) throw new Error('Resend response did not include an id.');
  return parsed.id;
}

export function batchIdempotencyKey(payloads, campaign) {
  const digest = createHash('sha256')
    .update(String(campaign))
    .update('\0')
    .update(JSON.stringify(payloads))
    .digest('hex');
  return `az-${campaign}-${digest.slice(0, 32)}`;
}

export async function sendBatch({ apiKey, messages, campaign }) {
  if (!campaign) throw new Error('sendBatch requires a campaign name.');
  if (messages.length === 0 || messages.length > 100) {
    throw new Error(`Batch size must be 1–100 (got ${messages.length}).`);
  }
  const payloads = messages.map(emailPayload);
  const parsed = await postResend(
    '/emails/batch',
    apiKey,
    payloads,
    { 'Idempotency-Key': batchIdempotencyKey(payloads, campaign) },
  );
  const ids = parsed.data?.map((item) => item.id) ?? [];
  if (ids.length !== messages.length || ids.some((id) => !id)) {
    throw new Error('Resend batch response did not include an id for every email.');
  }
  return ids;
}
