import { NextResponse } from 'next/server';
import { z } from 'zod';

const analyzeSchema = z.object({
  text: z.string().min(50).max(2000),
});

// ============================================================
// Analyseur local - fonctionne sans API payante
// Détecte les émotions par mots-clés en français
// ============================================================

const EMOTION_KEYWORDS: Record<string, string[]> = {
  joie: [
    'heureux', 'heureuse', 'content', 'contente', 'joie', 'bonheur', 'rire', 'sourire',
    'génial', 'super', 'formidable', 'excellent', 'merveilleux', 'fantastique', 'magnifique',
    'plaisir', 'amusant', 'fête', 'célébrer', 'victoire', 'réussi', 'gagné', 'bravo',
    'adore', 'aime', 'passion', 'enthousiaste', 'excité', 'ravie', 'ravi', 'enchanté',
    'positif', 'bien', 'top', 'cool', 'incroyable', 'épanoui', 'comblé', 'radieux',
  ],
  tristesse: [
    'triste', 'tristesse', 'pleurer', 'larmes', 'chagrin', 'mélancolie', 'deuil',
    'perdu', 'perte', 'manque', 'seul', 'solitude', 'isolé', 'abandonné', 'vide',
    'déprimé', 'dépression', 'malheureux', 'sombre', 'noir', 'souffrir', 'douleur',
    'déçu', 'déception', 'regret', 'regretter', 'nostalgie', 'mal', 'morne',
  ],
  colère: [
    'colère', 'furieux', 'furieuse', 'enragé', 'énervé', 'agacé', 'irrité',
    'injuste', 'injustice', 'révolte', 'rage', 'déteste', 'haine', 'violent',
    'exploser', 'crier', 'hurler', 'insupportable', 'intolérable', 'marre',
    'fâché', 'fâchée', 'exaspéré', 'outré', 'scandalisé', 'indigné',
  ],
  peur: [
    'peur', 'effrayé', 'terrifié', 'terreur', 'angoisse', 'cauchemar', 'danger',
    'menace', 'panique', 'phobique', 'crainte', 'redouter', 'trembler', 'paralysé',
    'horrifié', 'épouvante', 'sursaut', 'frayeur', 'effroi', 'sinistre',
  ],
  sérénité: [
    'serein', 'sereine', 'sérénité', 'calme', 'paix', 'paisible', 'tranquille',
    'zen', 'détente', 'détendu', 'relaxé', 'apaisé', 'harmonie', 'équilibre',
    'doux', 'douce', 'repos', 'silence', 'méditer', 'respirer', 'nature',
    'gratitude', 'reconnaissant', 'contempler', 'plénitude', 'confort',
  ],
  surprise: [
    'surprise', 'surpris', 'étonné', 'étonnant', 'inattendu', 'choc', 'choqué',
    'incroyable', 'impressionné', 'stupéfait', 'bouche bée', 'wow', 'waouh',
    'découvrir', 'découverte', 'révélation', 'imprévu', 'soudain',
  ],
  nostalgie: [
    'nostalgie', 'nostalgique', 'souvenir', 'souvenirs', 'passé', 'autrefois',
    'enfance', 'jeunesse', 'époque', 'ancien', 'avant', 'retour', 'mémoire',
    'revoir', 'rappeler', 'manquer', 'temps', 'jadis',
  ],
  anxiété: [
    'anxieux', 'anxieuse', 'anxiété', 'stress', 'stressé', 'nerveux', 'tendu',
    'inquiet', 'inquiétude', 'préoccupé', 'soucis', 'souci', 'angoisse', 'oppressé',
    'insomnie', 'ruminer', 'obsédé', 'pression', 'surcharge', 'débordé',
    'incertain', 'doute', 'hésiter', 'panique',
  ],
  espoir: [
    'espoir', 'espérer', 'optimiste', 'confiant', 'confiance', 'avenir', 'demain',
    'possible', 'opportunité', 'chance', 'rêve', 'rêver', 'projet', 'ambition',
    'croire', 'lumière', 'progrès', 'améliorer', 'mieux', 'promesse', 'foi',
    'motivation', 'déterminé', 'persévérer', 'courage',
  ],
  frustration: [
    'frustré', 'frustration', 'bloqué', 'coincé', 'impuissant', 'impossible',
    'obstacle', 'échec', 'échouer', 'raté', 'incompréhension', 'incompris',
    'inutile', 'vain', 'ennui', 'ennuyé', 'lassé', 'lassitude', 'répétitif',
    'compliqué', 'difficile', 'galère', 'problème', 'marre', 'ras-le-bol',
  ],
};

function analyzeLocally(text: string) {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/[\s,.;:!?'"()\-—]+/).filter(Boolean);

  // Score each emotion based on keyword matches
  const scores: Record<string, number> = {};
  let totalMatches = 0;

  for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
    let matchCount = 0;
    for (const keyword of keywords) {
      // Check both exact word and substring presence
      if (words.includes(keyword) || lowerText.includes(keyword)) {
        matchCount++;
      }
    }
    scores[emotion] = matchCount;
    totalMatches += matchCount;
  }

  // Normalize scores to 0-10
  const emotions = Object.entries(scores).map(([name, count]) => ({
    name,
    score: totalMatches > 0
      ? Math.min(10, Math.round((count / Math.max(totalMatches, 1)) * 15))
      : Math.floor(Math.random() * 3) + 1, // fallback random low score
  }));

  // Ensure at least one emotion has a decent score
  if (totalMatches === 0) {
    // No keywords matched - assign based on text length and punctuation analysis
    const hasExclamation = text.includes('!');
    const hasQuestion = text.includes('?');
    const hasEllipsis = text.includes('...');

    if (hasExclamation) {
      const idx = emotions.findIndex(e => e.name === 'surprise');
      if (idx >= 0) emotions[idx].score = 6;
    }
    if (hasQuestion) {
      const idx = emotions.findIndex(e => e.name === 'anxiété');
      if (idx >= 0) emotions[idx].score = 5;
    }
    if (hasEllipsis) {
      const idx = emotions.findIndex(e => e.name === 'nostalgie');
      if (idx >= 0) emotions[idx].score = 5;
    }

    // Default: sérénité baseline
    const sereniteIdx = emotions.findIndex(e => e.name === 'sérénité');
    if (sereniteIdx >= 0 && emotions[sereniteIdx].score < 3) {
      emotions[sereniteIdx].score = 4;
    }
  }

  // Find dominant emotion
  const sorted = [...emotions].sort((a, b) => b.score - a.score);
  const dominantEmotion = sorted[0].name;
  const intensity = Math.min(10, Math.max(1, sorted[0].score));

  // Determine valence
  const positiveEmotions = ['joie', 'sérénité', 'espoir', 'surprise'];
  const negativeEmotions = ['tristesse', 'colère', 'peur', 'anxiété', 'frustration'];
  const valence = positiveEmotions.includes(dominantEmotion)
    ? 'positive'
    : negativeEmotions.includes(dominantEmotion)
    ? 'negative'
    : 'neutre';

  // Extract keywords from actual text (most frequent meaningful words)
  const stopWords = new Set([
    'je', 'tu', 'il', 'elle', 'nous', 'vous', 'ils', 'elles', 'le', 'la', 'les',
    'un', 'une', 'des', 'de', 'du', 'au', 'aux', 'et', 'ou', 'mais', 'donc',
    'car', 'ni', 'que', 'qui', 'est', 'suis', 'es', 'sont', 'a', 'ai', 'as',
    'ont', 'être', 'avoir', 'faire', 'dit', 'dans', 'sur', 'avec', 'pour', 'par',
    'pas', 'ne', 'plus', 'ce', 'cette', 'ces', 'mon', 'ma', 'mes', 'ton', 'ta',
    'tes', 'son', 'sa', 'ses', 'en', 'se', 'si', 'on', 'me', 'te', 'lui',
    'leur', 'y', 'tout', 'très', 'aussi', 'même', 'comme', 'été', 'fait',
    'bien', 'peut', 'peu', 'trop', 'ça', 'cela', 'quand', 'où', 'comment',
    'aujourd', 'hui', "aujourd'hui", 'vraiment', 'encore', 'après', 'avant',
  ]);

  const wordFreq: Record<string, number> = {};
  for (const word of words) {
    if (word.length > 3 && !stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  }

  const keywords = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return {
    emotions,
    dominantEmotion,
    intensity,
    valence,
    keywords: keywords.length > 0 ? keywords : ['émotion', 'ressenti', 'expression'],
  };
}

// ============================================================
// Claude API analysis (when API key is valid & funded)
// ============================================================

const ANALYSIS_PROMPT = (inputText: string) =>
  `Analyse cette entrée émotionnelle et réponds UNIQUEMENT avec un objet JSON (sans backticks, sans texte avant ou après). Voici le texte :

"${inputText}"

Réponds avec cet exact format JSON :
{
  "emotions": [
    {"name": "joie", "score": 0},
    {"name": "tristesse", "score": 0},
    {"name": "colère", "score": 0},
    {"name": "peur", "score": 0},
    {"name": "sérénité", "score": 0},
    {"name": "surprise", "score": 0},
    {"name": "nostalgie", "score": 0},
    {"name": "anxiété", "score": 0},
    {"name": "espoir", "score": 0},
    {"name": "frustration", "score": 0}
  ],
  "dominantEmotion": "nom_de_l_emotion_dominante",
  "intensity": 7,
  "valence": "positive",
  "keywords": ["mot1", "mot2", "mot3"]
}

Donne un score de 0 à 10 pour chaque émotion. L'intensité globale doit être entre 0 et 10. La valence est "positive", "negative" ou "neutre".`;

async function analyzeWithClaude(text: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: ANALYSIS_PROMPT(text) }],
      }),
    });

    if (!response.ok) {
      console.warn('Claude API unavailable, using local analysis');
      return null;
    }

    const data = await response.json();
    const content = data.content[0].text.trim();
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleanContent);
  } catch {
    console.warn('Claude API error, falling back to local analysis');
    return null;
  }
}

// ============================================================
// Main handler - tries Claude first, falls back to local
// ============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Texte invalide (50-2000 caractères requis)' },
        { status: 400 }
      );
    }

    // Try Claude API first
    const claudeResult = await analyzeWithClaude(parsed.data.text);
    if (claudeResult) {
      return NextResponse.json(claudeResult);
    }

    // Fallback: local keyword-based analysis
    const localResult = analyzeLocally(parsed.data.text);
    return NextResponse.json(localResult);
  } catch (error) {
    console.error('Analyze error:', error);
    return NextResponse.json({ error: 'Erreur analyse' }, { status: 500 });
  }
}
