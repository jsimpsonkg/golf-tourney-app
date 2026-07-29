// Vercel serverless entry. A root-level `api/` folder is treated as functions,
// and `vercel.json` rewrites every `/api/*` request here. An Express app is
// itself a (req, res) handler, so re-exporting the configured app is enough —
// Vercel preserves the original path in req.url, so `app.use("/api", ...)`
// still matches.
import app from "../server/src/app";

export default app;
