import { createServerSupabaseClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

// Models tried in order until one works
const MODELS = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'];

async function callClaude(apiKey: string, prompt: string, maxTokens: number): Promise<string> {
  for (const model of MODELS) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        console.error(`[retrospective] Model ${model} failed ${response.status}:`, errBody);
        const apiMsg: string = errBody?.error?.message || '';
        // Crédits insuffisants → inutile de tenter les autres modèles
        if (apiMsg.toLowerCase().includes('credit balance')) {
          throw new Error('Crédits API insuffisants. Rechargez votre compte sur console.anthropic.com');
        }
        // Modèle inconnu → essayer le suivant
        if (response.status === 404 || (response.status === 400 && apiMsg.includes('model'))) continue;
        throw new Error(apiMsg || `API error ${response.status}`);
      }

      const data = await response.json();
      return data.content[0].text as string;
    } catch (err) {
      console.error(`[retrospective] Model ${model} threw:`, err);
      // If it's the last model, rethrow
      if (model === MODELS[MODELS.length - 1]) throw err;
    }
  }
  throw new Error('Tous les modèles IA ont échoué');
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { allowed } = rateLimit(`retrospective:${user.id}`, 5, 3_600_000); // 5 req/hour
  if (!allowed) {
    return NextResponse.json({ error: 'Limite atteinte. Réessayez dans une heure.' }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const period: 'monthly' | 'yearly' = body.period === 'yearly' ? 'yearly' : 'monthly';

  const now = new Date();
  let since: Date;
  let periodLabel: string;

  if (period === 'yearly') {
    since = new Date(now.getFullYear(), 0, 1);
    periodLabel = `l'année ${now.getFullYear()}`;
  } else {
    since = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    periodLabel = 'les 30 derniers jours';
  }

  const { data: entries, error: dbError } = await supabase
    .from('entries')
    .select('created_at, analysis')
    .eq('user_id', user.id)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: true });

  if (dbError) {
    console.error('[retrospective] DB error:', dbError);
    return NextResponse.json({ error: 'Erreur base de données' }, { status: 500 });
  }

  const minEntries = period === 'yearly' ? 5 : 3;

  if (!entries || entries.length < minEntries) {
    return NextResponse.json(
      { error: `Il faut au moins ${minEntries} entrées sur ${periodLabel} pour générer une rétrospective.` },
      { status: 400 }
    );
  }

  const summary = entries.map(e => ({
    date: new Date(e.created_at).toLocaleDateString('fr-FR'),
    emotion: e.analysis.dominantEmotion,
    intensity: e.analysis.intensity,
    keywords: e.analysis.keywords,
  }));

  let extraContext = '';
  if (period === 'yearly') {
    const byMonth: Record<string, { emotions: string[]; avgIntensity: number }> = {};
    entries.forEach(e => {
      const month = new Date(e.created_at).toLocaleDateString('fr-FR', { month: 'long' });
      if (!byMonth[month]) byMonth[month] = { emotions: [], avgIntensity: 0 };
      byMonth[month].emotions.push(e.analysis.dominantEmotion);
      byMonth[month].avgIntensity += e.analysis.intensity;
    });
    Object.entries(byMonth).forEach(([, v]) => {
      v.avgIntensity = parseFloat((v.avgIntensity / v.emotions.length).toFixed(1));
    });
    extraContext = `\n\nRésumé par mois :\n${JSON.stringify(byMonth, null, 2)}`;
  }

  const prompt = `Tu es un psychologue bienveillant analysant le journal émotionnel d'une personne. Voici ses ${entries.length} entrées sur ${periodLabel} :

${JSON.stringify(summary, null, 2)}${extraContext}

Génère une rétrospective ${period === 'yearly' ? 'annuelle' : 'mensuelle'} en français de ${period === 'yearly' ? '4-5' : '3-4'} paragraphes qui :
1. ${period === 'yearly' ? "Dresse un bilan de l'année émotionnelle avec les grandes tendances" : 'Résume les tendances émotionnelles dominantes observées'}
2. Identifie des moments clés positifs et des périodes difficiles
3. ${period === 'yearly' ? "Analyse l'évolution et la croissance émotionnelle sur l'année" : "Donne une observation bienveillante sur l'évolution"}
4. ${period === 'yearly' ? "Propose des intentions pour l'année à venir" : "Termine par un message d'encouragement personnalisé"}

Style : chaleureux, empathique, positif mais honnête. Commence directement sans titre.`;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Clé API IA manquante — vérifiez .env.local' }, { status: 503 });
  }

  try {
    const text = await callClaude(apiKey, prompt, period === 'yearly' ? 1200 : 900);
    return NextResponse.json({ retrospective: text, entryCount: entries.length, period });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('[retrospective] Final error:', message);
    return NextResponse.json(
      { error: `Génération impossible : ${message}` },
      { status: 500 }
    );
  }
}
