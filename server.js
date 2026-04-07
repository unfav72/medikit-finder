require('dotenv').config();
const express = require('express');
const multer  = require('multer');
const cors    = require('cors');
const Groq    = require('groq-sdk');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Groq client (key from .env only) ─────────────────────────────────────────
const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY || GROQ_KEY === 'your_groq_api_key_here') {
  console.error('\n❌  GROQ_API_KEY is not set in your .env file!');
  console.error('    Open .env and replace "your_groq_api_key_here" with your real key.');
  console.error('    Get a free key at: https://console.groq.com\n');
  process.exit(1);
}
const groq = new Groq({ apiKey: GROQ_KEY });
console.log('✅  Groq AI connected');

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── In-memory plant tag store ─────────────────────────────────────────────────
let taggedPlants = [];

// ── POST /api/identify ────────────────────────────────────────────────────────
app.post('/api/identify', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image provided' });

    const base64 = req.file.buffer.toString('base64');
    const mime   = req.file.mimetype;

    const prompt = `Identify the medicinal plant in this image. Respond ONLY with valid JSON — no markdown, no extra text:
{
  "name": "Common plant name",
  "scientificName": "Scientific name",
  "confidence": 85,
  "description": "Detailed description of the plant",
  "medicinalBenefits": ["benefit 1", "benefit 2", "benefit 3", "benefit 4"],
  "traditionalUses": ["use 1", "use 2", "use 3"],
  "preparation": "How to prepare for medicinal use",
  "precautions": ["precaution 1", "precaution 2"],
  "habitat": "Where this plant typically grows",
  "isPlant": true
}
If the image is NOT a plant, return: {"isPlant": false, "note": "reason"}`;

    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
          { type: 'text', text: prompt }
        ]
      }],
      max_tokens: 1200,
      temperature: 0.3
    });

    const raw   = response.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/gi, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse response from AI. Please try again.');

    res.json({ success: true, plant: JSON.parse(match[0]) });

  } catch (err) {
    console.error('Identify error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/translate ───────────────────────────────────────────────────────
app.post('/api/translate', async (req, res) => {
  try {
    const { plant } = req.body;
    if (!plant) return res.status(400).json({ error: 'No plant data provided' });

    const prompt = `Translate the following medicinal plant JSON to Tamil.
Return ONLY valid JSON — no markdown, no extra text.
Keep all JSON keys in English. Translate only the string values. Keep numbers and booleans unchanged.

${JSON.stringify(plant, null, 2)}`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1800,
      temperature: 0.2
    });

    const raw   = response.choices[0].message.content.trim();
    const clean = raw.replace(/```json|```/gi, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Could not parse Tamil translation.');

    res.json({ success: true, plant: JSON.parse(match[0]) });

  } catch (err) {
    console.error('Translate error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/tagged-plants ────────────────────────────────────────────────────
app.get('/api/tagged-plants', (req, res) => {
  const { lat, lng, radius = 50 } = req.query;
  if (lat && lng) {
    const nearby = taggedPlants.filter(p =>
      haversine(parseFloat(lat), parseFloat(lng), p.lat, p.lng) <= parseFloat(radius)
    );
    return res.json({ plants: nearby });
  }
  res.json({ plants: taggedPlants });
});

// ── POST /api/tag-plant ───────────────────────────────────────────────────────
app.post('/api/tag-plant', (req, res) => {
  const { plantName, lat, lng, notes, imageData, scientificName } = req.body;
  if (!plantName || lat == null || lng == null)
    return res.status(400).json({ error: 'plantName, lat, and lng are required' });

  const tag = {
    id: Date.now().toString(),
    plantName,
    scientificName: scientificName || '',
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    notes: notes || '',
    imageData: imageData || null,
    taggedAt: new Date().toISOString()
  };
  taggedPlants.push(tag);
  res.json({ success: true, tag });
});

// ── DELETE /api/tag-plant/:id ─────────────────────────────────────────────────
app.delete('/api/tag-plant/:id', (req, res) => {
  taggedPlants = taggedPlants.filter(p => p.id !== req.params.id);
  res.json({ success: true });
});

// ── Haversine distance (km) ───────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371, toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

app.listen(PORT, () => {
  console.log(`🌿 Medicinal Plant Finder → http://localhost:${PORT}\n`);
});
