import type { RequestHandler } from "express";

export const PASSWORD_HEADER = "x-tournament-pin";

// TOURNAMENT_PIN is the old name, kept so existing deploys don't break.
const configuredPassword = (): string | undefined =>
  process.env.TOURNAMENT_PASSWORD || process.env.TOURNAMENT_PIN;

export const requirePassword: RequestHandler = (req, res, next) => {
  const expected = configuredPassword();

  // Unconfigured means open locally so `npm run dev` needs no setup, but closed
  // in production — a deploy that forgot the env var must not serve everything.
  if (!expected) {
    if (process.env.NODE_ENV === "production") {
      console.error("TOURNAMENT_PASSWORD is not set — refusing requests");
      res.status(503).json({ error: "Site is not configured" });
      return;
    }
    next();
    return;
  }

  if (req.get(PASSWORD_HEADER) !== expected) {
    res.status(401).json({ error: "Invalid or missing password" });
    return;
  }

  next();
};

// Without this the gate would be unpassable when no password is configured.
export const getAccessStatus: RequestHandler = (_req, res) => {
  res.json({ required: Boolean(configuredPassword()) });
};

export const verifyPassword: RequestHandler = (req, res) => {
  const expected = configuredPassword();
  if (!expected) {
    res.json({ ok: true });
    return;
  }

  const supplied = (req.body as { password?: unknown } | undefined)?.password;
  if (typeof supplied !== "string" || supplied !== expected) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  res.json({ ok: true });
};
