import { type EmotionName, type VisualizationStyle } from '@/types';

// Maps emotions to artistic visual concepts for image generation
const EMOTION_AESTHETICS: Record<EmotionName, {
  palette: string;
  mood: string;
  elements: string;
  lighting: string;
}> = {
  joie: {
    palette: 'warm golden yellows, bright oranges, sunlit amber',
    mood: 'radiant, euphoric, bursting with warmth',
    elements: 'blooming flowers, light rays, floating particles of gold',
    lighting: 'bright golden hour sunlight, lens flares',
  },
  tristesse: {
    palette: 'deep ocean blues, soft indigos, muted lavender',
    mood: 'melancholic, contemplative, hauntingly beautiful',
    elements: 'rain drops, still water reflections, solitary landscapes',
    lighting: 'overcast diffused light, blue hour twilight',
  },
  colère: {
    palette: 'intense crimson reds, fiery oranges, deep burgundy',
    mood: 'explosive, visceral, turbulent energy',
    elements: 'cracked surfaces, volcanic textures, sharp angular forms',
    lighting: 'dramatic chiaroscuro, harsh contrast',
  },
  peur: {
    palette: 'dark slate grays, deep blacks, cold charcoal',
    mood: 'eerie, unsettling, shrouded in mystery',
    elements: 'fog, shadows, distorted silhouettes, dark forests',
    lighting: 'dim moonlight, faint glow through darkness',
  },
  sérénité: {
    palette: 'soft mint greens, gentle sky blues, pastel seafoam',
    mood: 'peaceful, zen-like, perfectly balanced calm',
    elements: 'still lakes, zen gardens, smooth pebbles, gentle waves',
    lighting: 'soft morning light, gentle ambient glow',
  },
  surprise: {
    palette: 'electric yellows, hot pinks, vivid magenta',
    mood: 'dynamic, unexpected, full of wonder',
    elements: 'bursting shapes, fireworks, prismatic reflections',
    lighting: 'flash of bright light, neon glow',
  },
  nostalgie: {
    palette: 'faded plums, dusty roses, vintage mauve',
    mood: 'wistful, dreamlike, bittersweet memory',
    elements: 'old photographs fading, autumn leaves, sunset silhouettes',
    lighting: 'warm vintage film grain, soft faded tones',
  },
  anxiété: {
    palette: 'muted grays, restless silver, dim ash tones',
    mood: 'tense, spiraling, fragmented unease',
    elements: 'tangled threads, labyrinthine patterns, static noise',
    lighting: 'flickering fluorescent, cold sterile light',
  },
  espoir: {
    palette: 'dawn blues, gentle golds, soft coral pink',
    mood: 'uplifting, aspirational, quietly optimistic',
    elements: 'sunrise horizon, seedlings growing, birds in flight',
    lighting: 'first light of dawn, warm gradient sky',
  },
  frustration: {
    palette: 'burnt oranges, rust reds, agitated amber',
    mood: 'restless, constrained energy seeking release',
    elements: 'crumpled surfaces, coiled springs, barriers breaking',
    lighting: 'harsh overhead light, strong shadows',
  },
};

const STYLE_MODIFIERS: Record<VisualizationStyle, string> = {
  geometrique: 'sacred geometry, precise geometric shapes, mathematical patterns, tessellations, clean vector-like forms',
  organique: 'organic flowing shapes, natural curves, biomorphic forms, fluid art, botanical inspiration',
  aquarelle: 'watercolor painting, wet-on-wet technique, pigment bleeding, paper texture, soft edges',
  minimaliste: 'minimalist composition, negative space, single focal point, clean lines, less is more',
  abstrait: 'abstract expressionism, bold brushstrokes, gestural marks, emotional color fields, Rothko-inspired',
  mosaique: 'mosaic tile pattern, tessellated fragments, stained glass effect, pieced together colorful tiles',
};

export function buildImagePrompt(
  emotion: EmotionName,
  intensity: number,
  style: VisualizationStyle,
  keywords: string[] = []
): string {
  const aesthetics = EMOTION_AESTHETICS[emotion] || EMOTION_AESTHETICS.joie;
  const styleModifier = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.aquarelle;

  const intensityDesc = intensity >= 8
    ? 'extremely intense and vivid'
    : intensity >= 5
    ? 'moderately expressive'
    : 'subtle and delicate';

  const keywordsStr = keywords.length > 0
    ? `Inspired by concepts: ${keywords.slice(0, 4).join(', ')}.`
    : '';

  return `A stunning square abstract artwork, ${styleModifier}.
Color palette: ${aesthetics.palette}.
Mood: ${aesthetics.mood}, ${intensityDesc}.
Visual elements: ${aesthetics.elements}.
Lighting: ${aesthetics.lighting}.
${keywordsStr}
Style: fine art, gallery quality, high resolution, no text, no words, no letters, no humans, no faces.
Aspect ratio 1:1.`.trim();
}

// Shorter prompt for URL-based APIs (like Pollinations.ai) to avoid URL length limits
export function buildShortImagePrompt(
  emotion: EmotionName,
  intensity: number,
  style: VisualizationStyle,
): string {
  const aesthetics = EMOTION_AESTHETICS[emotion] || EMOTION_AESTHETICS.joie;
  const styleModifier = STYLE_MODIFIERS[style] || STYLE_MODIFIERS.aquarelle;

  const intensityWord = intensity >= 8 ? 'vivid' : intensity >= 5 ? 'expressive' : 'subtle';

  return `${intensityWord} abstract ${styleModifier}, ${aesthetics.palette}, ${aesthetics.mood}, ${aesthetics.elements}, fine art, no text, no humans, square`;
}
