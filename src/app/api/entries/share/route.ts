import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/entries/share — create a share token for an entry
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const { entryId } = await request.json().catch(() => ({}));
  if (!entryId) return NextResponse.json({ error: 'entryId requis' }, { status: 400 });

  // Verify the entry belongs to the user
  const { data: entry } = await supabase
    .from('entries')
    .select('id')
    .eq('id', entryId)
    .eq('user_id', user.id)
    .single();

  if (!entry) return NextResponse.json({ error: 'Entrée introuvable' }, { status: 404 });

  // Upsert: one token per entry
  const { data, error } = await supabase
    .from('shared_entries')
    .upsert({ entry_id: entryId, user_id: user.id }, { onConflict: 'entry_id' })
    .select('token')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ token: data.token });
}
