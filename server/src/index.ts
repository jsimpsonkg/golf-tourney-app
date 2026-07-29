import app from './app';

// Local dev entry only (`npm run dev`). The deployed app has no long-lived
// process — see `api/index.ts` at the repo root.
const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server running on port ${port}`));
