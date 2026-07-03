# தொழுகை பதிவேடு (Prayer Tracker)

React + Vite + localStorage-ஐ பயன்படுத்தி 04-07-2025 முதல் 48 நாட்கள் (20-08-2025 வரை)
தினமும் 5 வேளை தொழுகையை track செய்யும் app.

## உள்ளூரில் run செய்ய (Local development)

```bash
npm install
npm run dev
```

பிறகு browser-ல் `http://localhost:5173` திற.

## Build

```bash
npm run build
```

`dist/` folder-ல் production build கிடைக்கும்.

## Vercel-ல் Deploy செய்ய

### வழி 1: Vercel CLI

```bash
npm install -g vercel
vercel
```

Framework Preset: **Vite** என தானாக கண்டறியப்படும்.
Build Command: `npm run build`
Output Directory: `dist`

### வழி 2: GitHub வழியாக

1. இந்த project-ஐ ஒரு GitHub repo-வில் push செய்.
2. [vercel.com](https://vercel.com) -ல் login செய்து "New Project" -> repo-ஐ select செய்.
3. Framework: Vite (auto-detect ஆகும்). Deploy சொடுக்கு.

## குறிப்பு

- Data browser-ன் `localStorage`-ல் சேமிக்கப்படும் (key: `prayerTrackerData_2025_07`).
- அதே browser, அதே device-ல் மட்டும் data தெரியும் — வேறு device/browser-ல் தெரியாது.
- "எல்லாவற்றையும் அழி" பட்டனை அழுத்தினால் எல்லா பதிவுகளும் நீங்கிவிடும்.
- தேதி வரம்பு அல்லது தொழுகை பெயர்களை மாற்ற `src/App.jsx`-ல் `START_DATE`, `END_DATE`, `PRAYERS` மாறிகளை edit செய்யவும்.
