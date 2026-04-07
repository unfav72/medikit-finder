# 🌿 வேர் Vēr — AI Medicinal Plant Finder

Groq AI-powered plant identification with Tamil translation, community map tagging, and image recognition.

---

## ⚡ Quick Start (3 steps)

### Step 1 — Install dependencies
```bash
cd medicinal-plant-finder
npm install
```

### Step 2 — Add your Groq API key
Open the `.env` file and paste your key:
```
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
> Get a **free** key at → https://console.groq.com  
> Sign up → Dashboard → API Keys → Create Key

### Step 3 — Run the server
```bash
npm start
```
Then open → **http://localhost:3000**

---

## 🔑 No .env? Use the In-Browser Setup

If you don't add the key to `.env`, the app will show a **Connect Groq AI** screen on startup where you can paste your key directly. It's saved for the browser session.

---

## 📁 File Structure

```
medicinal-plant-finder/
├── server.js            ← Express + Groq AI backend
├── package.json         ← Dependencies
├── .env                 ← Your API key goes here
└── public/
    └── index.html       ← Full frontend (single file)
```

---

## ✨ Features

| Feature | Details |
|---|---|
| 🔬 Plant ID | Upload any photo → Groq Llama 4 Scout vision identifies it |
| 💊 Medicinal Info | Benefits, uses, preparation, precautions, habitat |
| 🔤 Tamil Toggle | One-click EN↔தமிழ் translation via Llama 3.3 70B |
| 🗺️ Community Map | OpenStreetMap with all tagged plant locations |
| 📍 Plant Tagging | Click map to pin where you found a plant |
| 📱 Responsive | Works on mobile, tablet, desktop |

---

## 🔌 API Endpoints

```
GET  /api/health           → Check if .env key is loaded
POST /api/validate-key     → Test a key before using it
POST /api/identify         → Identify plant from image
POST /api/translate        → Translate plant info to Tamil
GET  /api/tagged-plants    → Get community plant tags
POST /api/tag-plant        → Save a new plant tag
DEL  /api/tag-plant/:id    → Remove a plant tag
```

---

## 🤖 Groq Models Used

- **Vision** → `meta-llama/llama-4-scout-17b-16e-instruct`  
- **Translation** → `llama-3.3-70b-versatile`

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| "API key invalid" | Make sure key starts with `gsk_` and has no extra spaces |
| "Cannot reach server" | Run `npm start` and ensure port 3000 is free |
| ".env not loading" | Ensure `.env` is in the same folder as `server.js` |
| Translation blank | Tamil toggle only works after identifying a plant |
