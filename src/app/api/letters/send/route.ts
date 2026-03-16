import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// This endpoint is called daily by Vercel Cron
// Authorization: Bearer token matches CRON_SECRET env variable
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role key to bypass RLS for cron job
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const now = new Date().toISOString();

  const { data: letters, error } = await supabase
    .from('future_letters')
    .select('*')
    .eq('sent', false)
    .lte('send_at', now)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!letters || letters.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;
  const errors: string[] = [];

  for (const letter of letters) {
    const daysAgo = Math.round(
      (Date.now() - new Date(letter.created_at).getTime()) / 86_400_000
    );

    const html = buildEmailHtml({
      text: letter.text,
      dominantEmotion: letter.dominant_emotion,
      visualizationUrl: letter.visualization_url,
      daysAgo,
    });

    try {
      await resend.emails.send({
        from: 'ECHO. <onboarding@resend.dev>',
        to: letter.email,
        subject: `Une lettre de votre passé — il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`,
        html,
      });

      await supabase
        .from('future_letters')
        .update({ sent: true })
        .eq('id', letter.id);

      sent++;
    } catch (e) {
      errors.push(`${letter.id}: ${e}`);
    }
  }

  return NextResponse.json({ sent, errors });
}

function buildEmailHtml({
  text,
  dominantEmotion,
  visualizationUrl,
  daysAgo,
}: {
  text: string;
  dominantEmotion: string;
  visualizationUrl: string;
  daysAgo: number;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Une lettre de votre passé</title>
</head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="padding:40px 40px 0;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;">ECHO.</p>
              <h1 style="margin:0;font-size:26px;color:#0f172a;font-weight:400;">
                Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}, vous vous sentiez…
              </h1>
              <p style="margin:12px 0 0;font-size:14px;color:#64748b;">
                Vous vous étiez écrit une lettre. La voici.
              </p>
            </td>
          </tr>

          <!-- Emotion badge -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <span style="display:inline-block;padding:6px 20px;border-radius:999px;background:#f1f5f9;font-size:13px;color:#475569;text-transform:capitalize;letter-spacing:0.05em;">
                ${dominantEmotion}
              </span>
            </td>
          </tr>

          <!-- Visualization -->
          ${visualizationUrl.startsWith('data:') ? '' : `
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <img src="${visualizationUrl}" alt="Votre tuile émotionnelle"
                style="width:120px;height:120px;border-radius:16px;object-fit:cover;" />
            </td>
          </tr>
          `}

          <!-- Letter text -->
          <tr>
            <td style="padding:32px 40px;">
              <div style="background:#f8f7f4;border-radius:16px;padding:24px;border-left:3px solid #e2e8f0;">
                <p style="margin:0;font-size:15px;line-height:1.75;color:#334155;white-space:pre-wrap;">${text}</p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 40px;text-align:center;">
              <p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.6;">
                Votre passé vous rappelle que chaque émotion traverse et passe.<br />
                Comment vous sentez-vous aujourd'hui ?
              </p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/create"
                style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff;border-radius:999px;font-size:13px;text-decoration:none;font-family:sans-serif;">
                Écrire une nouvelle entrée
              </a>
              <p style="margin:24px 0 0;font-size:11px;color:#cbd5e1;">ECHO. — Votre journal émotionnel</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
