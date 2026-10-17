/**
 * Send two reminder-email TEST messages to one hardcoded inbox.
 * Does not read a guest list and has no batch mode.
 *
 *   node scripts/guest-mail/send-test.mjs --dry-run
 *   node scripts/guest-mail/send-test.mjs --campaign=2026-10-17-details
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  REPLY_TO,
  escapeHtml,
  fill,
  fromAddress,
  loadEnvFile,
  sendOne,
  subjectFor,
} from './mail.mjs';

const TEST_TO = 'zglorenz@gmail.com';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../..');
const DEFAULT_CAMPAIGN = '2026-10-17-details';

function campaignDir() {
  const flag = process.argv.find((arg) => arg.startsWith('--campaign='));
  const name = flag ? flag.slice('--campaign='.length).trim() : DEFAULT_CAMPAIGN;
  return resolve(HERE, 'campaigns', name);
}

function renderTest(outDir, lang, firstName, guestCount) {
  const subjects = readFileSync(resolve(outDir, 'subjects.txt'), 'utf8');
  const code = lang.toLowerCase();
  const values = { first_name: firstName, guest_count: guestCount };
  return {
    lang,
    subject: `[TEST ${lang}] ${subjectFor(subjects, lang)}`,
    html: fill(readFileSync(resolve(outDir, `reminder_${code}.html`), 'utf8'), values),
    text: fill(readFileSync(resolve(outDir, `reminder_${code}.txt`), 'utf8'), values),
  };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  loadEnvFile(resolve(ROOT, '.env'));

  const apiKey = process.env.AZ_RESEND_API_KEY || '';
  if (!dryRun && !apiKey) {
    throw new Error('AZ_RESEND_API_KEY is not set.');
  }

  const from = fromAddress();
  const escaped = {
    firstName: escapeHtml('Zach'),
    guestCount: escapeHtml('2'),
  };
  const outDir = campaignDir();
  const messages = [
    renderTest(outDir, 'EN', escaped.firstName, escaped.guestCount),
    renderTest(outDir, 'RU', escaped.firstName, escaped.guestCount),
  ];

  for (const message of messages) {
    if (dryRun) {
      console.log('---');
      console.log(`From: ${from}`);
      console.log(`To: ${TEST_TO}`);
      console.log(`Reply-To: ${REPLY_TO}`);
      console.log(`Subject: ${message.subject}`);
      console.log(`HTML[0:200]: ${message.html.slice(0, 200).replaceAll('\n', ' ')}`);
      continue;
    }
    if (TEST_TO !== 'zglorenz@gmail.com') {
      throw new Error('Refusing to send: TEST_TO was changed.');
    }
    const id = await sendOne({
      apiKey,
      message: { ...message, from, to: [TEST_TO] },
    });
    console.log(`${message.lang} sent id=${id}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
