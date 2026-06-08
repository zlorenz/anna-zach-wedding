/**
 * RSVP confirmation emails via Resend (https://resend.com) — fetch only, no SDK.
 */

export type RsvpEmailContext = {
  firstName: string;
  name: string;
  email: string;
  isYes: boolean;
  dietary?: string;
  addlGuestCount: number;
  guests: Array<{ name: string; age: string; dietary: string }>;
};

const WEDDING_DATE = 'Saturday, December 5, 2026';
const WEDDING_PLACE = 'Nha Trang, Vietnam';

function env(name: string): string {
  return (import.meta.env[name] as string | undefined)?.trim() || '';
}

function siteUrl(): string {
  return env('AZ_SITE_URL').replace(/\/$/, '') || 'https://annaandzach.love';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildAcceptedBodies(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'there';
  const lines: string[] = [
    `Hi ${first},`,
    '',
    `Thank you — we've received your RSVP for our wedding in ${WEDDING_PLACE} on ${WEDDING_DATE}.`,
    '',
    "Here's what we have on file:",
    `• Attending: Yes`,
    `• Your dietary notes: ${(ctx.dietary || '').trim() || 'None'}`,
  ];

  if (ctx.addlGuestCount > 0) {
    lines.push(`• Additional guests: ${ctx.addlGuestCount}`);
    for (let i = 0; i < ctx.addlGuestCount; i++) {
      const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
      const gn = g.name.trim() || 'Guest';
      const ga = g.age.trim() || '—';
      const gd = g.dietary.trim() || 'None';
      lines.push(`  – Guest ${i + 1}: ${gn} (${ga}), dietary: ${gd}`);
    }
  } else {
    lines.push('• Additional guests: None');
  }

  lines.push(
    '',
    'If anything needs to change, reply to this email or submit the RSVP form again with the same email address.',
    '',
    `Itinerary & travel: ${siteUrl()}/itinerary/`,
    '',
    'With love,',
    'Anna & Zach',
  );

  const text = lines.join('\n');

  const guestHtml =
    ctx.addlGuestCount > 0
      ? `<ul style="margin:0.5em 0 0;padding-left:1.25em;">${Array.from({ length: ctx.addlGuestCount }, (_, i) => {
          const g = ctx.guests[i] || { name: '', age: '', dietary: '' };
          const gn = escapeHtml(g.name.trim() || 'Guest');
          const ga = escapeHtml(g.age.trim() || '—');
          const gd = escapeHtml(g.dietary.trim() || 'None');
          return `<li>Guest ${i + 1}: ${gn} (${ga}) — dietary: ${gd}</li>`;
        }).join('')}</ul>`
      : '<p style="margin:0.35em 0 0;">None</p>';

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#F0EBE3;font-family:Georgia,'Times New Roman',serif;color:#5C4F47;">
  <div style="max-width:32rem;margin:0 auto;padding:2rem 1.25rem;">
    <p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Thank you — we've received your RSVP for our wedding in ${WEDDING_PLACE} on ${WEDDING_DATE}.</p>
    <p style="margin:0 0 0.5rem;font-weight:600;color:#2C2420;">Here's what we have on file:</p>
    <ul style="margin:0;padding-left:1.25em;line-height:1.55;">
      <li>Attending: <strong>Yes</strong></li>
      <li>Your dietary notes: ${escapeHtml((ctx.dietary || '').trim() || 'None')}</li>
      <li>Additional guests: ${ctx.addlGuestCount}</li>
    </ul>
    ${guestHtml}
    <p style="margin:1.25rem 0;line-height:1.6;">If anything needs to change, reply to this email or submit the <a href="${siteUrl()}/rsvp/" style="color:#2C2420;">RSVP form</a> again with the same email address.</p>
    <p style="margin:0 0 1rem;"><a href="${siteUrl()}/itinerary/" style="color:#2C2420;">View itinerary &amp; travel →</a></p>
    <p style="margin:1.5rem 0 0;color:#2C2420;">With love,<br>Anna &amp; Zach</p>
  </div>
</body>
</html>`;

  return {
    subject: "We received your RSVP — Anna & Zach",
    text,
    html,
  };
}

function buildDeclinedBodies(ctx: RsvpEmailContext): { subject: string; text: string; html: string } {
  const first = ctx.firstName || ctx.name.split(' ')[0] || 'there';
  const text = [
    `Hi ${first},`,
    '',
    "Thank you for letting us know — we've received your response.",
    '',
    `We're sorry you won't be able to join us in ${WEDDING_PLACE} on ${WEDDING_DATE}, but we appreciate you taking the time to reply.`,
    '',
    'If your plans change, you can update your response anytime:',
    `${siteUrl()}/rsvp/`,
    '',
    'With love,',
    'Anna & Zach',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#F0EBE3;font-family:Georgia,'Times New Roman',serif;color:#5C4F47;">
  <div style="max-width:32rem;margin:0 auto;padding:2rem 1.25rem;">
    <p style="margin:0 0 1rem;font-size:1.05rem;color:#2C2420;">Hi ${escapeHtml(first)},</p>
    <p style="margin:0 0 1rem;line-height:1.6;">Thank you for letting us know — we've received your response.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">We're sorry you won't be able to join us in ${WEDDING_PLACE} on ${WEDDING_DATE}, but we appreciate you taking the time to reply.</p>
    <p style="margin:0 0 1rem;line-height:1.6;">If your plans change, you can <a href="${siteUrl()}/rsvp/" style="color:#2C2420;">update your RSVP</a> anytime.</p>
    <p style="margin:1.5rem 0 0;color:#2C2420;">With love,<br>Anna &amp; Zach</p>
  </div>
</body>
</html>`;

  return {
    subject: 'We received your response — Anna & Zach',
    text,
    html,
  };
}

export async function sendRsvpConfirmationEmail(ctx: RsvpEmailContext): Promise<void> {
  const apiKey = env('AZ_RESEND_API_KEY');
  const from = env('AZ_RSVP_EMAIL_FROM');
  if (!apiKey || !from) {
    return;
  }

  const to = ctx.email.trim();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    console.error('[AZ Email] Invalid recipient address.');
    return;
  }

  const { subject, text, html } = ctx.isYes ? buildAcceptedBodies(ctx) : buildDeclinedBodies(ctx);
  const replyTo = env('AZ_RSVP_REPLY_TO');

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
