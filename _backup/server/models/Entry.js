const mongoose = require('mongoose');

const EmotionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    score: { type: Number, required: true },
  },
  { _id: false }
);

const AnalysisSchema = new mongoose.Schema(
  {
    emotions: { type: [EmotionSchema], default: [] },
    dominantEmotion: { type: String, required: true },
    intensity: { type: Number, required: true },
    valence: { type: String, required: true },
    keywords: { type: [String], default: [] },
  },
  { _id: false }
);

const EntrySchema = new mongoose.Schema({
  text: { type: String, required: true },
  createdAt: { type: Date, required: true },
  analysis: { type: AnalysisSchema, required: true },
  visualization: { type: String, required: true },
});

module.exports = mongoose.model('Entry', EntrySchema);
