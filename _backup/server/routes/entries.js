const express = require('express');
const Entry = require('../models/Entry');

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const entries = await Entry.find().sort({ createdAt: -1 }).lean();
    res.json(entries);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement entrées' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const entry = await Entry.findById(req.params.id).lean();
    if (!entry) return res.status(404).json({ error: 'Entrée introuvable' });
    res.json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Erreur chargement entrée' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { text, createdAt, analysis, visualization } = req.body;
    if (!text || !analysis || !visualization) {
      return res.status(400).json({ error: 'Données manquantes' });
    }

    const entry = await Entry.create({
      text,
      createdAt: createdAt ? new Date(createdAt) : new Date(),
      analysis,
      visualization,
    });

    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ error: 'Erreur sauvegarde entrée' });
  }
});

module.exports = router;
