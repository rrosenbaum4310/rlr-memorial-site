const ALLOWED_ORIGINS = [
  'https://rlrosenbaum.com',
  'https://www.rlrosenbaum.com',
  'http://localhost',
  'http://127.0.0.1',
  'null', // local file:// origin
];

function getCorsHeaders(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.some(o => origin === o || origin.startsWith(o));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    try {
      const formData = await request.formData();

      const firstName = formData.get('first_name')?.trim() || '';
      const lastName = formData.get('last_name')?.trim() || '';
      const email = formData.get('email')?.trim() || '';
      const phone = formData.get('phone')?.trim() || '';
      const reason = formData.get('reason') || 'other';
      const message = formData.get('message')?.trim() || '';

      if (!firstName || !email || !message) {
        return Response.json(
          { error: 'Name, email, and message are required.' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Verify Cloudflare Turnstile token
      const turnstileToken = formData.get('cf-turnstile-response') || '';
      const turnstileRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          secret: env.TURNSTILE_SECRET_KEY,
          response: turnstileToken,
          remoteip: request.headers.get('CF-Connecting-IP'),
        }),
      });
      const turnstileResult = await turnstileRes.json();
      if (!turnstileResult.success) {
        return Response.json(
          { error: 'Spam check failed. Please try again.' },
          { status: 403, headers: corsHeaders }
        );
      }

      const reasonLabels = {
        remembrance: 'Sharing a Remembrance',
        'previous-case': 'Previous Case Inquiry',
        referral: 'Seeking a Referral',
        other: 'Other',
      };

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `RLR Memorial <${env.FROM_EMAIL}>`,
          to: [env.TO_EMAIL],
          reply_to: email,
          subject: `[rlrosenbaum.com] ${reasonLabels[reason] || reason} from ${firstName} ${lastName}`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1e1e1e;">
              <h2 style="color: #0f1923; border-bottom: 2px solid #c8a862; padding-bottom: 12px;">
                New message from rlrosenbaum.com
              </h2>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #7a7570; width: 120px;">Name</td>
                  <td style="padding: 8px 12px;">${firstName} ${lastName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #7a7570;">Email</td>
                  <td style="padding: 8px 12px;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                ${phone ? `<tr><td style="padding: 8px 12px; font-weight: bold; color: #7a7570;">Phone</td><td style="padding: 8px 12px;">${phone}</td></tr>` : ''}
                <tr>
                  <td style="padding: 8px 12px; font-weight: bold; color: #7a7570;">Reason</td>
                  <td style="padding: 8px 12px;">${reasonLabels[reason] || reason}</td>
                </tr>
              </table>
              <div style="background: #faf8f4; border-left: 3px solid #c8a862; padding: 16px 20px; margin: 20px 0; white-space: pre-wrap;">${message}</div>
              <p style="font-size: 13px; color: #85807a; margin-top: 24px;">Sent via the Richard L. Rosenbaum memorial website contact form.</p>
            </div>
          `,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error('Resend error:', err);
        return Response.json(
          { error: 'Failed to send message.' },
          { status: 500, headers: corsHeaders }
        );
      }

      return Response.json(
        { success: true, message: 'Message sent.' },
        { status: 200, headers: corsHeaders }
      );
    } catch (err) {
      console.error('Worker error:', err);
      return Response.json(
        { error: 'Something went wrong.' },
        { status: 500, headers: corsHeaders }
      );
    }
  },
};
