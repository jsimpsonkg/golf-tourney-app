# Golf Tournament Organizer

A live golf tournament organizer built to track scores hole-by-hole and display a real-time leaderboard as players move through their round.

## Overview

The core of the app is a **format-agnostic scoring model** — every score entered is stored as a simple "this side took Y strokes on hole Z" record, independent of whatever tournament structure is layered on top. This matters because the app is designed so that changing formats later (or supporting a tournament with multiple formats across different days or sessions) doesn't require reworking the underlying data — only the scoring logic that interprets it.

The initial build targets a **Ryder Cup–style format**: players are split into **two teams**, matches are organized into **rounds** (stored as `sessions`), and each round carries its own point value that contributes to an overall team score. As scores are entered from the course, the app computes match status (holes up/down, points earned) in real time and pushes updates to a shared leaderboard view that anyone in the group can watch live on their phone.

### Confirmed format

- **Two overall teams.**
- **Round 1 — 2v2 scramble match play.** Each side's two players play one ball, so the round records **one score per side per hole**. The match winner earns a point for their team.
- **Round 2 — 1v1 match play (singles).** Each player records their own score per hole; each match winner earns a point for their team.
- More rounds can be added later without schema changes — a round is just another `session` with its own `session_type` and `point_value`.

### Scoring granularity (per-player vs per-side)

Formats differ in *who* a score belongs to. Singles and four-ball are **per-player** (each player has their own ball); scramble and foursomes are **per-side** (one shared ball, one score per side). Because there are exactly two teams, a "side" within any match is identified by its `team_id`, so a `score_entry` is attributed to **either a player or a team** — never both. The match-play lens then compares the two sides hole-by-hole regardless of how the underlying scores were entered.

Because the scoring logic for each format lives in its own swappable module rather than being baked into the database schema, the same app can later support straight stroke play, better-ball, or scrambles without a rebuild — the Ryder Cup format is simply the first "lens" applied to the underlying hole-by-hole data.

## Tech Stack

- **Postgres** — database
- **Express** — API server
- **React** (Vite) — frontend
- **Node.js** — runtime
- **Drizzle ORM** — schema, migrations, and querying
- **Tailwind CSS** — styling
- **Socket.io** — real-time leaderboard updates

## Project Structure

```
golf-tourney-app/
  server/       # Express API + Drizzle schema/migrations
  client/       # Vite + React + Tailwind frontend
```

## Status

🚧 Early setup — schema and scoring engine in progress.

Note: This instance is intentionally simple for a small friend-group tournament — there are no per-user accounts or extensive metadata; players are entered as lightweight profiles and scoring is hole-by-hole.