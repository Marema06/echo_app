import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Public endpoint — no auth required
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await supabase
    .from('shared_entries')
    .select('entry_id, entries(text, created_at, visualization_url, analysis)')
    .eq('token', params.token)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Lien introuvable' }, { status: 404 });

  return NextResponse.json({ entry: data.entries });
}
