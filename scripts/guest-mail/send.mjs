/**
 * Render and send one guest-mail campaign.
 *
 * Templates: scripts/guest-mail/campaigns/<campaign>/
 *   reminder_en.html, reminder_ru.html, reminder_en.txt, reminder_ru.txt, subjects.txt
 *   Placeholders: {{first_name}} and {{guest_count}}
 * Guest list (gitignored): private/guest-mail/recipients.csv
 * Send history (gitignored): private/guest-mail/sent_log.csv
 *   A row counts as sent only for the campaign named in that row.
 *
 *   node scripts/guest-mail/send.mjs
 *   node scripts/guest-mail/send.mjs --campaign=2026-10-17-details --send
 *
 * A later note is a new folder copied from this campaign, with the copy edited
 * and a new --campaign name. The guest list stays the same file.
 */

import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  fromAddress,
  loadEnvFile,
  loadKit,
  renderReminder,
  sendBatch,
} from './mail.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const DEFAULT_CAMPAIGN = '2026-10-17-details';
const CSV_PATH = resolve(ROOT, 'private/guest-mail/recipients.csv');
const LOG_PATH = resolve(ROOT, 'private/guest-mail/sent_log.csv');

const CYRILLIC = /[\u0400-\u04FF]/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseCsv(text) {
  const src = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i++) {
    const char = src[i];
    if (inQuotes) {
      if (char === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

function loadRecipients(path) {
  const table = parseCsv(readFileSync(path, 'utf8'));
  if (table.length < 2) throw new Error(`${path} has no data rows.`);
  const header = table[0].map((cell) => cell.trim());
  const required = ['email', 'first_name', 'language', 'guest_count', 'review'];
  for (const name of required) {
    if (!header.includes(name)) throw new Error(`CSV is missing the "${name}" column.`);
  }
  const index = Object.fromEntries(header.map((name, i) => [name, i]));
  const seen = new Map();
  const recipients = [];
  let skipped = 0;

  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    const line = r + 1;
    const email = (cells[index.email] || '').trim();
    const firstName = (cells[index.first_name] || '').trim();
    const language = (cells[index.language] || '').trim().toLowerCase();
    const guestCount = (cells[index.guest_count] || '').trim();
    const review = (cells[index.review] || '').trim();

    if (!EMAIL.test(email)) {
      throw new Error(`Row ${line}: malformed email "${email}".`);
    }
    const key = email.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`Row ${line}: duplicate email ${email} (also on row ${seen.get(key)}).`);
    }
    seen.set(key, line);

    if (!firstName) throw new Error(`Row ${line}: first_name is empty.`);
    if (!guestCount) throw new Error(`Row ${line}: guest_count is empty.`);
    if (language !== 'en' && language !== 'ru') {
      throw new Error(`Row ${line}: language must be "en" or "ru" (got "${language}").`);
    }
    const hasCyrillic = CYRILLIC.test(firstName);
    if (language === 'ru' && !hasCyrillic) {
      throw new Error(`Row ${line}: Russian first_name "${firstName}" has no Cyrillic letters.`);
    }
    if (language === 'en' && hasCyrillic) {
      throw new Error(`Row ${line}: English first_name "${firstName}" contains Cyrillic letters.`);
    }
    if (review) {
      skipped += 1;
      continue;
    }

    recipients.push({ email, firstName, language, guestCount: Number(guestCount) });
    if (!Number.isInteger(recipients.at(-1).guestCount) || recipients.at(-1).guestCount < 1) {
      throw new Error(`Row ${line}: guest_count "${guestCount}" is not a positive whole number.`);
    }
  }

  return { recipients, skipped };
}

function preview(html, language) {
  const greeting =
    language === 'ru'
      ? html.match(/Здравствуйте, ([^!<]+)!/)
      : html.match(/Hi ([^<,]+),/);
  const party =
    language === 'ru'
      ? html.match(/Гостей в вашей группе:[\s\S]*?<b[^>]*>([^<]+)<\/b>/)
      : html.match(/Guests in your party:[\s\S]*?<b[^>]*>([^<]+)<\/b>/);
  if (!greeting || !party) {
    throw new Error('Rendered HTML is missing the greeting or guest-count line.');
  }
  const name = greeting[1]
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"');
  const line = language === 'ru' ? `Здравствуйте, ${name}!` : `Hi ${name},`;
  return { greeting: line, party: party[1] };
}

function renderAll(recipients, outDir) {
  const kit = loadKit(outDir);
  return recipients.map((recipient) => {
    const rendered = renderReminder(kit, {
      lang: recipient.language,
      firstName: recipient.firstName,
      guestCount: recipient.guestCount,
    });
    const shown = preview(rendered.html, recipient.language);
    if (shown.party !== String(recipient.guestCount)) {
      throw new Error(
        `Guest count mismatch for ${recipient.email}: template says ${shown.party}, CSV says ${recipient.guestCount}.`,
      );
    }
    return { ...recipient, ...rendered, ...shown };
  });
}

const LIST_UNSUBSCRIBE = '<mailto:zglorenz@gmail.com?subject=unsubscribe>';

function guestReplyTo() {
  const value = (process.env.GUEST_REPLY_TO || 'rsvp@annaandzach.love').trim();
  if (!value) throw new Error('GUEST_REPLY_TO is empty.');
  return value;
}

function printPlan(messages, skipped, replyTo, campaign) {
  const en = messages.filter((message) => message.language === 'en').length;
  const ru = messages.filter((message) => message.language === 'ru').length;
  const guests = messages.reduce((sum, message) => sum + message.guestCount, 0);
  for (const [i, message] of messages.entries()) {
    console.log(
      `${i + 1}\t${message.email}\t${message.firstName}\t${message.language}\t${message.guestCount}\t${message.subject}`,
    );
    console.log(`   ${message.greeting}`);
    console.log(`   Guests in your party: ${message.party}`);
  }
  console.log('---');
  console.log(`Campaign: ${campaign}`);
  console.log(`Recipients: ${messages.length}`);
  console.log(`English: ${en}`);
  console.log(`Russian: ${ru}`);
  console.log(`Guests: ${guests}`);
  console.log(`Skipped (review): ${skipped}`);
  console.log(`Reply-To: ${replyTo}`);
  console.log(`List-Unsubscribe: ${LIST_UNSUBSCRIBE}`);
  return { en, ru, guests };
}

function csvCell(value) {
  const text = String(value ?? '');
  if (/[",\n]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function loadSent(path, campaign) {
  if (!existsSync(path)) return new Set();
  const table = parseCsv(readFileSync(path, 'utf8'));
  const header = table[0].map((cell) => cell.trim());
  const campaignIdx = header.indexOf('campaign');
  const emailIdx = header.indexOf('email');
  const statusIdx = header.indexOf('status');
  if (campaignIdx < 0 || emailIdx < 0 || statusIdx < 0) {
    throw new Error('sent_log.csv is missing campaign, email, or status columns.');
  }
  const sent = new Set();
  for (const row of table.slice(1)) {
    if ((row[campaignIdx] || '').trim() !== campaign) continue;
    if ((row[statusIdx] || '').trim().toLowerCase() === 'sent') {
      sent.add((row[emailIdx] || '').trim().toLowerCase());
    }
  }
  return sent;
}

function appendLog(path, rows) {
  if (!existsSync(path)) {
    writeFileSync(path, 'campaign,email,status,id,timestamp\n');
  }
  const lines = rows
    .map((row) =>
      [row.campaign, row.email, row.status, row.id, row.timestamp].map(csvCell).join(','),
    )
    .join('\n');
  appendFileSync(path, `${lines}\n`);
}

async function confirmSend(count) {
  if (!input.isTTY) {
    throw new Error('Refusing to send: stdin is not an interactive terminal.');
  }
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question(`Type ${count} to send ${count} emails: `)).trim();
    if (answer !== String(count)) {
      throw new Error(`Aborted. Expected you to type ${count}.`);
    }
  } finally {
    rl.close();
  }
}

function campaignName() {
  const flag = process.argv.find((arg) => arg.startsWith('--campaign='));
  const name = flag ? flag.slice('--campaign='.length).trim() : DEFAULT_CAMPAIGN;
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error(`Campaign name must be lowercase letters, numbers, and hyphens (got "${name}").`);
  }
  return name;
}

function recipientsPath() {
  const flag = process.argv.find((arg) => arg.startsWith('--recipients='));
  if (!flag) return CSV_PATH;
  const given = flag.slice('--recipients='.length).trim();
  if (!given) throw new Error('--recipients needs a file path.');
  return resolve(given);
}

function onlyAddresses() {
  const flag = process.argv.find((arg) => arg.startsWith('--only='));
  if (!flag) return null;
  const emails = flag
    .slice('--only='.length)
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (emails.length === 0) throw new Error('--only needs at least one email address.');
  return emails;
}

function restrictTo(recipients, emails) {
  if (!emails) return recipients;
  const byEmail = new Map(recipients.map((recipient) => [recipient.email.toLowerCase(), recipient]));
  return emails.map((email) => {
    const recipient = byEmail.get(email);
    if (!recipient) throw new Error(`--only address is not in the guest list: ${email}`);
    return recipient;
  });
}

async function main() {
  const send = process.argv.includes('--send');
  const campaign = campaignName();
  const outDir = resolve(HERE, 'campaigns', campaign);
  if (!existsSync(resolve(outDir, 'subjects.txt'))) {
    throw new Error(`No templates for campaign "${campaign}" at ${outDir}`);
  }
  loadEnvFile(resolve(ROOT, '.env'));
  const replyTo = guestReplyTo();
  const csvPath = recipientsPath();
  if (!existsSync(csvPath)) throw new Error(`Guest list not found: ${csvPath}`);

  const { recipients: allRecipients, skipped } = loadRecipients(csvPath);
  const recipients = restrictTo(allRecipients, onlyAddresses());
  const messages = renderAll(recipients, outDir);
  printPlan(messages, skipped, replyTo, campaign);

  if (!send) return;

  const alreadySent = loadSent(LOG_PATH, campaign);
  const pending = messages.filter((message) => !alreadySent.has(message.email.toLowerCase()));
  const skippedSent = messages.length - pending.length;
  if (skippedSent > 0) {
    console.log(`Already sent, skipping: ${skippedSent}`);
  }
  if (pending.length === 0) {
    console.log('Nothing left to send.');
    return;
  }

  const pendingEn = pending.filter((message) => message.language === 'en').length;
  const pendingRu = pending.filter((message) => message.language === 'ru').length;
  console.log(
    `About to send ${pending.length} emails (${pendingEn} English, ${pendingRu} Russian).`,
  );
  await confirmSend(pending.length);

  const apiKey = process.env.AZ_RESEND_API_KEY || '';
  if (!apiKey) throw new Error('AZ_RESEND_API_KEY is not set.');
  const from = fromAddress();

  for (let offset = 0; offset < pending.length; offset += 100) {
    const chunk = pending.slice(offset, offset + 100);
    const payload = chunk.map((message) => ({
      from,
      to: [message.email],
      reply_to: replyTo,
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: {
        'List-Unsubscribe': LIST_UNSUBSCRIBE,
      },
    }));
    const ids = await sendBatch({ apiKey, messages: payload, campaign });
    const timestamp = new Date().toISOString();
    appendLog(
      LOG_PATH,
      chunk.map((message, i) => ({
        campaign,
        email: message.email,
        status: 'sent',
        id: ids[i],
        timestamp,
      })),
    );
    for (const [i, message] of chunk.entries()) {
      console.log(`sent ${message.email} id=${ids[i]}`);
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
