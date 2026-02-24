const express = require('express');

const router = express.Router();

const ANALYSIS_PROMPT = (inputText) => `Analyse cette entrée émotionnelle et réponds UNIQUEMENT avec un objet JSON (sans backticks, sans texte avant ou après). Voici le texte :

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

Donne un score de 0 à 10 pour chaque émotion. L'intensité globale doit être entre 0 et 10.`;

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'Texte manquant' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY manquant' });

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
        messages: [
          {
            role: 'user',
            content: ANALYSIS_PROMPT(text),
          },
        ],
      }),
    });

    if (!response.ok) {
      const message = await response.text();
      return res.status(502).json({ error: 'Erreur IA', details: message });
    }

    const data = await response.json();
    const content = data.content[0].text.trim();
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanContent);

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({ error: 'Erreur analyse IA' });
  }
});

module.exports = router;
