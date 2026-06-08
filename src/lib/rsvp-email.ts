/**
 * RSVP confirmation emails via Resend (https://resend.com) — fetch only, no SDK.
 */

import { getEnv } from './env';
import { type Locale, localizePath } from './i18n';

export type RsvpEmailContext = {
  firstName: string;
  name: string;
  email: string;
  isYes: boolean;
  dietary?: string;
  addlGuestCount: number;
  guests: Array<{ name: string; age: string; dietary: string }>;
  locale?: Locale;
};

const WEDDING_DATE_EN = 'Saturday, December 5, 2026';
const WEDDING_PLACE_EN = 'Nha Trang, Vietnam';
const WEDDING_DATE_RU = '5 декабря 2026 года';
const WEDDING_PLACE_RU = 'Нячанг, Вьетнам';

function siteUrl(): string {
  return getEnv('AZ_SITE_URL').replace(/\/$/, '') || 'https://annaandzach.love';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function resolveLocale(locale?: Locale): Locale {
  return locale === 'ru' ? 'ru' : 'en';
}

function formatDietary(value: string | undefined, locale: Locale): string {
  const trimmed = (value || '').trim();
  if (!trimmed || trimmed === 'None') {
    return locale === 'ru' ? 'Нет' : 'None';
  }
  return trimmed;
}

function formatAge(age: string, locale: Locale): string {
  const trimmed = age.trim();
  if (!trimmed) return '—';
  if (locale === 'ru') {
    const labels: Record<string, string> = {
      Adult: 'Взрослый',
      Child: 'Ребёнок',
      Infant: 'Младенец',
    };
    return labels[trimmed] || trimmed;
  }
  return trimmed;
}

function guestName(name: string, locale: Locale): string {
  const trimmed = name.trim();
  if (trimmed) return trimmed;
  return locale === 'ru' ? 'Гость' : 'Guest';
}

function emailShell(lang: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#F0EBE3;font-family:Georgia,'Times New Roman',serif;color:#5C4F47;">
  <div style="max-width:32rem;margin:0 auto;padding:2rem 1.25rem;">
    ${body}
    <p style="margin:1.5rem 0 0;color:#2C2420;">${lang === 'ru' ? 'С любовью,' : 'With love,'}<br>Anna &amp; Zach</p>
  </div>
</body>
</html>`;
}

function buildAcceptedBodies(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const locale = resolveLocale(ctx.locale);
  if (locale === 'ru') {
    return buildAcceptedBodiesRu(ctx);
  }
  return buildAcceptedBodiesEn(ctx);
}

function buildAcceptedBodiesEn(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'there';
  const base = siteUrl();
  const dietary = formatDietary(ctx.dietary, 'en');
  const lines: string[] = [
    `Hi ${first},`,
    '',
    `Thank you — we've received your RSVP for our wedding in ${WEDDING_PLACE_EN} on ${WEDDING_DATE_EN}.`,
    '',
    "Here's what we have on file:",
    `• Attending: Yes`,
    `• Your dietary notes: ${dietary}`,
  ];

  if (ctx.addlGuestCount > 0) {
    lines.push(`• Additional guests: ${ctx.addlGuestCount}`);
    for (let i = 0; i < ctx.addlGuestCount; i++) {
      const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
      const gn = guestName(g.name, 'en');
      const ga = formatAge(g.age, 'en');
      const gd = formatDietary(g.dietary, 'en');
      lines.push(`  – Guest ${i + 1}: ${gn} (${ga}), dietary: ${gd}`);
    }
  } else {
    lines.push('• Additional guests: None');
  }

  lines.push(
    '',
    'If anything needs to change, reply to this email or submit the RSVP form again with the same email address.',
    '',
    `Itinerary & travel: ${base}${localizePath('/itinerary/', 'en')}`,
    '',
    'With love,',
    'Anna & Zach',
  );

  const guestHtml =
    ctx.addlGuestCount > 0
      ? `<ul style="margin:0.5em 0 0;padding-left:1.25em;">${Array.from({ length: ctx.addlGuestCount }, (_, i) => {
          const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
          const gn = escapeHtml(guestName(g.name, 'en'));
          const ga = escapeHtml(formatAge(g.age, 'en'));
          const gd = escapeHtml(formatDietary(g.dietary, 'en'));
          return `<li>Guest ${i + 1}: ${gn} (${ga}) — dietary: ${gd}</li>`;
        }).join('')}</ul>`
      : '<p style="margin:0.35em 0 0;">None</p>';

  const html = emailShell(
    'en',
    `<p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Thank you — we've received your RSVP for our wedding in ${WEDDING_PLACE_EN} on ${WEDDING_DATE_EN}.</p>
    <p style="margin:0 0 0.5rem;font-weight:600;color:#2C2420;">Here's what we have on file:</p>
    <ul style="margin:0;padding-left:1.25em;line-height:1.55;">
      <li>Attending: <strong>Yes</strong></li>
      <li>Your dietary notes: ${escapeHtml(dietary)}</li>
      <li>Additional guests: ${ctx.addlGuestCount}</li>
    </ul>
    ${guestHtml}
    <p style="margin:1.25rem 0;line-height:1.6;">If anything needs to change, reply to this email or submit the <a href="${base}${localizePath('/rsvp/', 'en')}" style="color:#2C2420;">RSVP form</a> again with the same email address.</p>
    <p style="margin:0 0 1rem;"><a href="${base}${localizePath('/itinerary/', 'en')}" style="color:#2C2420;">View itinerary &amp; travel →</a></p>`,
  );

  return {
    subject: "We received your RSVP — Anna & Zach",
    text: lines.join('\n'),
    html,
  };
}

function buildAcceptedBodiesRu(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'друг';
  const base = siteUrl();
  const dietary = formatDietary(ctx.dietary, 'ru');
  const lines: string[] = [
    `${first},`,
    '',
    `Спасибо! Мы получили ваш ответ на приглашение на нашу свадьбу в ${WEDDING_PLACE_RU}, ${WEDDING_DATE_RU}.`,
    '',
    'Вот что у нас записано:',
    '• Участие: Да',
    `• Ваши пожелания по питанию: ${dietary}`,
  ];

  if (ctx.addlGuestCount > 0) {
    lines.push(`• Дополнительные гости: ${ctx.addlGuestCount}`);
    for (let i = 0; i < ctx.addlGuestCount; i++) {
      const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
      const gn = guestName(g.name, 'ru');
      const ga = formatAge(g.age, 'ru');
      const gd = formatDietary(g.dietary, 'ru');
      lines.push(`  – Гость ${i + 1}: ${gn} (${ga}), питание: ${gd}`);
    }
  } else {
    lines.push('• Дополнительные гости: Нет');
  }

  lines.push(
    '',
    'Если что-то изменится, ответьте на это письмо или снова заполните форму с тем же адресом эл. почты.',
    '',
    `Программа и дорога: ${base}${localizePath('/itinerary/', 'ru')}`,
    '',
    'С любовью,',
    'Anna & Zach',
  );

  const guestHtml =
    ctx.addlGuestCount > 0
      ? `<ul style="margin:0.5em 0 0;padding-left:1.25em;">${Array.from({ length: ctx.addlGuestCount }, (_, i) => {
          const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
          const gn = escapeHtml(guestName(g.name, 'ru'));
          const ga = escapeHtml(formatAge(g.age, 'ru'));
          const gd = escapeHtml(formatDietary(g.dietary, 'ru'));
          return `<li>Гость ${i + 1}: ${gn} (${ga}), питание: ${gd}</li>`;
        }).join('')}</ul>`
      : '<p style="margin:0.35em 0 0;">Нет</p>';

  const html = emailShell(
    'ru',
    `<p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Спасибо! Мы получили ваш ответ на приглашение на нашу свадьбу в ${WEDDING_PLACE_RU}, ${WEDDING_DATE_RU}.</p>
    <p style="margin:0 0 0.5rem;font-weight:600;color:#2C2420;">Вот что у нас записано:</p>
    <ul style="margin:0;padding-left:1.25em;line-height:1.55;">
      <li>Участие: <strong>Да</strong></li>
      <li>Ваши пожелания по питанию: ${escapeHtml(dietary)}</li>
      <li>Дополнительные гости: ${ctx.addlGuestCount}</li>
    </ul>
    ${guestHtml}
    <p style="margin:1.25rem 0;line-height:1.6;">Если что-то изменится, ответьте на это письмо или снова заполните <a href="${base}${localizePath('/rsvp/', 'ru')}" style="color:#2C2420;">форму ответа на приглашение</a> с тем же адресом эл. почты.</p>
    <p style="margin:0 0 1rem;"><a href="${base}${localizePath('/itinerary/', 'ru')}" style="color:#2C2420;">Программа и дорога →</a></p>`,
  );

  return {
    subject: 'Мы получили ваш ответ на приглашение, Anna & Zach',
    text: lines.join('\n'),
    html,
  };
}

function buildDeclinedBodies(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const locale = resolveLocale(ctx.locale);
  if (locale === 'ru') {
    return buildDeclinedBodiesRu(ctx);
  }
  return buildDeclinedBodiesEn(ctx);
}

function buildDeclinedBodiesEn(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'there';
  const base = siteUrl();
  const text = [
    `Hi ${first},`,
    '',
    "Thank you for letting us know — we've received your response.",
    '',
    `We're sorry you won't be able to join us in ${WEDDING_PLACE_EN} on ${WEDDING_DATE_EN}, but we appreciate you taking the time to reply.`,
    '',
    'If your plans change, you can update your response anytime:',
    `${base}${localizePath('/rsvp/', 'en')}`,
    '',
    'With love,',
    'Anna & Zach',
  ].join('\n');

  const html = emailShell(
    'en',
    `<p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Thank you for letting us know — we've received your response.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">We're sorry you won't be able to join us in ${WEDDING_PLACE_EN} on ${WEDDING_DATE_EN}, but we appreciate you taking the time to reply.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">If your plans change, you can <a href="${base}${localizePath('/rsvp/', 'en')}" style="color:#2C2420;">update your RSVP</a> anytime.</p>`,
  );

  return {
    subject: 'We received your response — Anna & Zach',
    text,
    html,
  };
}

function buildDeclinedBodiesRu(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'друг';
  const base = siteUrl();
  const text = [
    `${first},`,
    '',
    'Спасибо, что ответили. Мы получили ваш ответ.',
    '',
    `Жаль, что вы не сможете приехать к нам в ${WEDDING_PLACE_RU} ${WEDDING_DATE_RU}, но очень ценим, что нашли время ответить.`,
    '',
    'Если планы изменятся, вы можете в любой момент обновить ответ:',
    `${base}${localizePath('/rsvp/', 'ru')}`,
    '',
    'С любовью,',
    'Anna & Zach',
  ].join('\n');

  const html = emailShell(
    'ru',
    `<p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Спасибо, что ответили. Мы получили ваш ответ.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Жаль, что вы не сможете приехать к нам в ${WEDDING_PLACE_RU} ${WEDDING_DATE_RU}, но очень ценим, что нашли время ответить.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Если планы изменятся, вы можете в любой момент <a href="${base}${localizePath('/rsvp/', 'ru')}" style="color:#2C2420;">обновить ответ</a>.</p>`,
  );

  return {
    subject: 'Спасибо за ответ, Anna & Zach',
    text,
    html,
  };
}

export async function sendRsvpConfirmationEmail(ctx: RsvpEmailContext): Promise<void> {
  const apiKey = getEnv('AZ_RESEND_API_KEY');
  const from = getEnv('AZ_RSVP_EMAIL_FROM');
  if (!apiKey || !from) {
    console.error('[AZ Email] AZ_RESEND_API_KEY or AZ_RSVP_EMAIL_FROM is not set.');
    return;
  }

  const to = ctx.email.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('[AZ Email] Invalid recipient address.');
    return;
  }

  const { subject, text, html } = ctx.isYes ? buildAcceptedBodies(ctx) : buildDeclinedBodies(ctx);
  const replyTo = getEnv('AZ_RSVP_REPLY_TO');

  const body: Record<string, unknown> = {
    from,
    to: [to],
    subject,
    text,
    html,
  };
  if (replyTo) body.reply_to = replyTo;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    console.error('[AZ Email] HTTP', res.status, (await res.text()).slice(0, 300));
  }
}
