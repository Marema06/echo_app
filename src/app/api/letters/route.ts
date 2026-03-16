import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const DELAYS: Record<number, string> = {
  30: '30 jours',
  90: '3 mois',
  365: '1 an',
};

const createLetterSchema = z.object({
  text: z.string().min(1),
  dominant_emotion: z.string(),
  visualization_url: z.string(),
  delay_days: z.union([z.literal(30), z.literal(90), z.literal(365)]),
});

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { data, error } = await supabase
    .from('future_letters')
    .select('id, dominant_emotion, send_at, sent, created_at, visualization_url')
    .eq('user_id', user.id)
    .order('send_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ letters: data || [] });
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await request.json();
  const parsed = createLetterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
  }

  const { text, dominant_emotion, visualization_url, delay_days } = parsed.data;

  const send_at = new Date();
  send_at.setDate(send_at.getDate() + delay_days);

  const { data: letter, error } = await supabase
    .from('future_letters')
    .insert({
      user_id: user.id,
      email: user.email!,
      text,
      dominant_emotion,
      visualization_url,
      send_at: send_at.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    letter,
    message: `Lettre programmée dans ${DELAYS[delay_days]}`,
  }, { status: 201 });
}

export async function DELETE(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { id } = await request.json();
  const { error } = await supabase
    .from('future_letters')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
