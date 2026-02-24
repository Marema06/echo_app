import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createEntrySchema = z.object({
  text: z.string().min(50).max(2000),
  analysis: z.object({
    emotions: z.array(z.object({ name: z.string(), score: z.number() })),
    dominantEmotion: z.string(),
    intensity: z.number().min(0).max(10),
    valence: z.enum(['positive', 'negative', 'neutre']),
    keywords: z.array(z.string()),
  }),
  visualization_url: z.string(),
  visualization_style: z.string(),
  tags: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const { data: entries, error, count } = await supabase
    .from('entries')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    entries: entries || [],
    total: count || 0,
    page,
    hasMore: (count || 0) > offset + limit,
  });
}

export async function POST(request: Request) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createEntrySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Données invalides', details: parsed.error.issues },
      { status: 400 }
    );
  }

  // Ensure user profile exists in our users table (auto-create from auth)
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', user.id)
    .single();

  if (!existingUser) {
    const { error: createUserError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email || '',
      });

    if (createUserError) {
      console.error('Error creating user profile:', createUserError);
      return NextResponse.json(
        { error: 'Erreur création profil: ' + createUserError.message },
        { status: 500 }
      );
    }
  }

  const { data: entry, error } = await supabase
    .from('entries')
    .insert({
      user_id: user.id,
      text: parsed.data.text,
      analysis: parsed.data.analysis,
      visualization_url: parsed.data.visualization_url,
      visualization_style: parsed.data.visualization_style,
      tags: parsed.data.tags || parsed.data.analysis.keywords,
    })
    .select()
    .single();

  if (error) {
    console.error('Entry insert error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(entry, { status: 201 });
}
