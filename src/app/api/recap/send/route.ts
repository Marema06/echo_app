import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Called every Sunday at 8am by Vercel Cron
export async function GET(request: Request) {
  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const oneWeekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();

  const { data: entries } = await supabase
    .from('entries')
    .select('user_id, analysis')
    .gte('created_at', oneWeekAgo);

  if (!entries || entries.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const byUser: Record<string, typeof entries> = {};
  for (const e of entries) {
    if (!byUser[e.user_id]) byUser[e.user_id] = [];
    byUser[e.user_id].push(e);
  }

  const userIds = Object.keys(byUser);
  const { data: users } = await supabase
    .from('users')
    .select('id, email')
    .in('id', userIds);

  if (!users) return NextResponse.json({ sent: 0 });

  let sent = 0;
  for (const user of users) {
    const userEntries = byUser[user.id] || [];
    if (userEntries.length < 2) continue;

    const emotionCounts: Record<string, number> = {};
    let totalIntensity = 0;
    for (const e of userEntries) {
      emotionCounts[e.analysis.dominantEmotion] = (emotionCounts[e.analysis.dominantEmotion] || 0) + 1;
      totalIntensity += e.analysis.intensity;
    }

    const topEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'inconnue';
    const avgIntensity = parseFloat((totalIntensity / userEntries.length).toFixed(1));

    try {
      await resend.emails.send({
        from: 'ECHO. <onboarding@resend.dev>',
        to: user.email,
        subject: `Votre semaine émotionnelle — ${userEntries.length} entrée${userEntries.length > 1 ? 's' : ''}`,
        html: buildRecapHtml({ entryCount: userEntries.length, topEmotion, avgIntensity }),
      });
      sent++;
    } catch (e) {
      console.error(`Failed recap for ${user.email}:`, e);
    }
  }

  return NextResponse.json({ sent });
}

function buildRecapHtml({ entryCount, topEmotion, avgIntensity }: {
  entryCount: number;
  topEmotion: string;
  avgIntensity: number;
}) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><title>Votre semaine sur ECHO.</title></head>
<body style="margin:0;padding:0;background:#f8f7f4;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f4;padding:40px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr><td style="padding:40px 40px 24px;text-align:center;">
          <p style="margin:0 0 4px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;">ECHO.</p>
          <h1 style="margin:0;font-size:26px;color:#0f172a;font-weight:400;">Votre semaine émotionnelle</h1>
          <p style="margin:12px 0 0;font-size:14px;color:#64748b;">Voici ce que votre journal révèle de cette semaine.</p>
        </td></tr>
        <tr><td style="padding:0 40px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr>
              <td style="width:33%;padding:0 6px 0 0;">
                <div style="background:#f8f7f4;border-radius:16px;padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;font-family:sans-serif;">Entrées</p>
                  <p style="margin:0;font-size:32px;color:#0f172a;">${entryCount}</p>
                </div>
              </td>
              <td style="width:33%;padding:0 3px;">
                <div style="background:#f8f7f4;border-radius:16px;padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;font-family:sans-serif;">Intensité moy.</p>
                  <p style="margin:0;font-size:32px;color:#0f172a;">${avgIntensity}<span style="font-size:16px;color:#94a3b8;">/10</span></p>
                </div>
              </td>
              <td style="width:33%;padding:0 0 0 6px;">
                <div style="background:#f8f7f4;border-radius:16px;padding:20px;text-align:center;">
                  <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#94a3b8;font-family:sans-serif;">Émotion dominante</p>
                  <p style="margin:0;font-size:18px;color:#0f172a;text-transform:capitalize;">${topEmotion}</p>
                </div>
              </td>
            </tr>
          </table>
          <div style="text-align:center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/stats"
               style="display:inline-block;padding:12px 28px;background:#0f172a;color:#ffffff;border-radius:999px;font-size:13px;text-decoration:none;font-family:sans-serif;">
              Voir mes statistiques
            </a>
          </div>
          <p style="margin:24px 0 0;font-size:11px;color:#cbd5e1;text-align:center;font-family:sans-serif;">ECHO. — Votre journal émotionnel</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
