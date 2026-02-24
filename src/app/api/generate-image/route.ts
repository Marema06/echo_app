import { NextResponse } from 'next/server';
import { buildShortImagePrompt } from '@/lib/emotion-prompt';
import { type EmotionName, type VisualizationStyle } from '@/types';

export const maxDuration = 60; // Allow up to 60s for image generation

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000), // 30s timeout per attempt
      });
      if (response.ok) return response;
      if (i < retries) {
        await new Promise(r => setTimeout(r, 1000 * (i + 1))); // wait 1s, 2s...
        continue;
      }
      return response; // Return last failed response
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries reached');
}

export async function POST(request: Request) {
  try {
    const { emotion, intensity, style } = await request.json();

    // Use short prompt to stay within URL length limits
    const prompt = buildShortImagePrompt(
      emotion as EmotionName,
      intensity as number,
      style as VisualizationStyle,
    );

    const encodedPrompt = encodeURIComponent(prompt);
    const seed = Math.floor(Math.random() * 100000);
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=768&height=768&nologo=true&seed=${seed}`;

    console.log('Pollinations URL length:', pollinationsUrl.length);
    console.log('Prompt:', prompt);

    const imageResponse = await fetchWithRetry(pollinationsUrl);

    if (!imageResponse.ok) {
      console.error(`Pollinations error: ${imageResponse.status} ${imageResponse.statusText}`);
      // Return a flag telling the client to fall back to canvas
      return NextResponse.json(
        { error: 'Service image IA temporairement indisponible', fallback: true },
        { status: 503 }
      );
    }

    const contentType = imageResponse.headers.get('content-type') || '';

    // Make sure we got an actual image and not an error page
    if (!contentType.includes('image')) {
      console.error('Pollinations returned non-image content:', contentType);
      return NextResponse.json(
        { error: 'Réponse invalide du service image', fallback: true },
        { status: 503 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64 = Buffer.from(imageBuffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      url: dataUrl,
      prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération d\'image', fallback: true },
      { status: 500 }
    );
  }
}
