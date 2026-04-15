import webpush from 'web-push';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const MESSAGES = [
  { title: 'ECHO. vous attend', body: 'Comment vous sentez-vous aujourd\'hui ? Capturez ce moment.' },
  { title: 'Un instant pour vous', body: 'Prenez 2 minutes pour noter votre ressenti du jour.' },
  { title: 'Votre mosaïque grandit', body: 'Une nouvelle tuile attend d\'être créée. Qu\'avez-vous ressenti aujourd\'hui ?' },
  { title: 'Bonne soirée', body: 'Avant de terminer votre journée, confiez vos émotions à ECHO.' },
  { title: 'ECHO. vous écoute', body: 'Exprimez librement ce que vous portez en vous aujourd\'hui.' },
];

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('id, subscription');

  if (error || !subs?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
  const payload = JSON.stringify({ title: msg.title, body: msg.body, url: '/create' });

  const results = await Promise.allSettled(
    subs.map(row => webpush.sendNotification(row.subscription, payload))
  );

  // Remove expired subscriptions (410 Gone)
  const expired = subs
    .filter((_, i) => {
      const r = results[i];
      return r.status === 'rejected' && (r.reason as { statusCode?: number })?.statusCode === 410;
    })
    .map(row => row.id);

  if (expired.length > 0) {
    await supabase.from('push_subscriptions').delete().in('id', expired);
  }

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return NextResponse.json({ sent, total: subs.length });
}
