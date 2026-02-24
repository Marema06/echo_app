require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDb } = require('./db');
const entriesRouter = require('./routes/entries');
const aiRouter = require('./routes/ai');

const app = express();

app.use(cors({ origin: ['http://localhost:3000'], methods: ['GET', 'POST', 'DELETE'] }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/entries', entriesRouter);
app.use('/api/analyze', aiRouter);

const start = async () => {
  try {
    await connectDb();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      console.log(`API prête sur http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Erreur de démarrage serveur', error);
    process.exit(1);
  }
};

start();
