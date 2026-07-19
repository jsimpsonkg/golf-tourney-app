# Golf Tournament Organizer

A live golf tournament organizer built to track scores hole-by-hole and display a real-time leaderboard as players move through their round.

## Overview

The core of the app is a **format-agnostic scoring model** — every score entered is stored as a simple "player X took Y strokes on hole Z" record, independent of whatever tournament structure is layered on top. This matters because the exact format for our tournament isn't finalized yet, and the app is designed so that changing formats later (or supporting a tournament with multiple formats across different days or sessions) doesn't require reworking the underlying data — only the scoring logic that interprets it.

The initial build targets a **Ryder Cup–style format**: players are split into teams, matches are organized into sessions (e.g., foursomes, four-ball, singles), and each session carries its own point value that contributes to an overall team score. As scores are entered from the course, the app computes match status (holes up/down, points earned) in real time and pushes updates to a shared leaderboard view that anyone in the group can watch live on their phone.

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