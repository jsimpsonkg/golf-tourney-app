import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import apiRouter from './routes/index';

// Builds and exports the configured app without listening. `src/index.ts` is
// the local-dev entry that calls listen(); on Vercel the app is imported by
// `api/index.ts` and driven per-request, where listen() must never be called.
const app = express();
app.use(cors()); // same-origin in prod, so this is only exercised in local dev
app.use(express.json());

app.get("/", (request, response) => {
  response.status(200).send("Golf Tournaments");
});

app.use('/api', apiRouter);

export default app;
