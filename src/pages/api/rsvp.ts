import type { APIRoute } from 'astro';
import { processRsvpSubmission, type RsvpPayload } from '../../lib/rsvp';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = (await request.json()) as RsvpPayload;
    if (!body.email?.trim() || !body.firstName?.trim()) {
      return new Response(JSON.stringify({ error: 'Name and email are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!body.attending?.trim()) {
      return new Response(JSON.stringify({ error: 'Please choose whether you will be attending.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await processRsvpSubmission({
      ...body,
      sourceUrl: request.headers.get('referer') || '',
      userAgent: request.headers.get('user-agent') || '',
    });

    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid request.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
