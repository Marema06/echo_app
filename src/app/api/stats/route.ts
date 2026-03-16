import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: entries, error } = await supabase
    .from('entries')
    .select('id, created_at, analysis')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const emotionCounts: Record<string, number> = {};
  const monthlyData: Record<string, number> = {};
  const calendarData: Record<string, { emotion: string; intensity: number; count: number }> = {};
  let totalIntensity = 0;

  for (const entry of entries) {
    const emotion = entry.analysis.dominantEmotion as string;
    const intensity = entry.analysis.intensity as number;

    emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
    totalIntensity += intensity;

    const date = new Date(entry.created_at);
    const monthKey = date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;

    const dayKey = date.toISOString().split('T')[0];
    if (!calendarData[dayKey]) {
      calendarData[dayKey] = { emotion, intensity, count: 1 };
    } else {
      calendarData[dayKey].count += 1;
      if (intensity > calendarData[dayKey].intensity) {
        calendarData[dayKey].emotion = emotion;
        calendarData[dayKey].intensity = intensity;
      }
    }
  }

  // Compute journaling streak
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  // Check today first, then yesterday, then go back
  let checkedToday = false;
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (calendarData[dateStr]) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (!checkedToday) {
      // Today might not have an entry yet — check yesterday
      checkedToday = true;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const sorted = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1]);

  // Last 6 months ordered
  const last6Months = Object.entries(monthlyData).slice(-6);

  return NextResponse.json({
    totalEntries: entries.length,
    avgIntensity: parseFloat((totalIntensity / entries.length).toFixed(1)),
    mostFrequent: sorted[0] || null,
    emotionCounts,
    monthlyData: Object.fromEntries(last6Months),
    calendarData,
    streak,
  });
}
