import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: entry, error } = await supabase
    .from('entries')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single();

  if (error || !entry) {
    return NextResponse.json({ error: 'Entrée non trouvée' }, { status: 404 });
  }

  return NextResponse.json(entry);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();

  const { data: entry, error } = await supabase
    .from('entries')
    .update({
      text: body.text,
      analysis: body.analysis,
      visualization_url: body.visualization_url,
      visualization_style: body.visualization_style,
      tags: body.tags,
    })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(entry);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
