import {
	pgTable,
	uuid,
	text,
	integer,
	numeric,
	timestamp,
	jsonb,
	uniqueIndex,
	index,
} from "drizzle-orm/pg-core";

export const tournaments = pgTable("tournaments", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	start_date: timestamp("start_date", { withTimezone: true }),
	image_url: text("image_url"), // e.g. '/images/dolphins.jpg' served from client/public
	format: text("format"), // e.g. 'rydercup', 'strokeplay'
	settings: jsonb("settings").default({}),
	created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teams = pgTable("teams", {
	id: uuid("id").defaultRandom().primaryKey(),
	tournament_id: uuid("tournament_id")
		.references(() => tournaments.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name").notNull(),
});

export const players = pgTable("players", {
	id: uuid("id").defaultRandom().primaryKey(),
	name: text("name").notNull(),
	tournament_id: uuid("tournament_id")
		.references(() => tournaments.id, { onDelete: "cascade" })
		.notNull(),
	// Nullable: players can be created before team assignment / draft.
	team_id: uuid("team_id").references(() => teams.id, { onDelete: "set null" }),
});

export const sessions = pgTable("sessions", {
	id: uuid("id").defaultRandom().primaryKey(),
	tournament_id: uuid("tournament_id")
		.references(() => tournaments.id, { onDelete: "cascade" })
		.notNull(),
	name: text("name"),
	session_type: text("session_type"), // e.g. 'foursomes', 'fourball', 'singles'
	// Points a single match in this session is worth (0.5 granularity for halved matches).
	point_value: numeric("point_value", { precision: 4, scale: 2 }).default("1").notNull(),
	sort_order: integer("sort_order").default(0),
});

export const matches = pgTable("matches", {
	id: uuid("id").defaultRandom().primaryKey(),
	session_id: uuid("session_id")
		.references(() => sessions.id, { onDelete: "cascade" })
		.notNull(),
	match_number: integer("match_number"),
	status: text("status").default("pending"), // 'pending' | 'in_progress' | 'completed'
	started_at: timestamp("started_at", { withTimezone: true }),
});

// Who is playing in a match, and on which side. One row per player per match,
// so it flexes across session types (1 player/side for singles, 2 for four-ball/foursomes).
export const match_participants = pgTable(
	"match_participants",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		match_id: uuid("match_id")
			.references(() => matches.id, { onDelete: "cascade" })
			.notNull(),
		player_id: uuid("player_id")
			.references(() => players.id, { onDelete: "cascade" })
			.notNull(),
		team_id: uuid("team_id")
			.references(() => teams.id, { onDelete: "cascade" })
			.notNull(),
	},
	(t) => [
		uniqueIndex("match_participants_match_player_unq").on(t.match_id, t.player_id),
		index("match_participants_match_idx").on(t.match_id),
	],
);

export const course_holes = pgTable(
	"course_holes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tournament_id: uuid("tournament_id")
			.references(() => tournaments.id, { onDelete: "cascade" })
			.notNull(),
		hole_number: integer("hole_number").notNull(),
		par: integer("par").notNull(),
		stroke_index: integer("stroke_index"), // hole difficulty ranking, for net/handicap play
	},
	(t) => [uniqueIndex("course_holes_tournament_hole_unq").on(t.tournament_id, t.hole_number)],
);

export const score_entries = pgTable(
	"score_entries",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		player_id: uuid("player_id")
			.references(() => players.id, { onDelete: "cascade" })
			.notNull(),
		match_id: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }),
		hole_number: integer("hole_number").notNull(),
		strokes: integer("strokes").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		// One score per player/hole within a match; enables upsert on live re-entry / corrections.
		uniqueIndex("score_entries_player_match_hole_unq").on(t.player_id, t.match_id, t.hole_number),
		index("score_entries_match_idx").on(t.match_id),
		index("score_entries_player_idx").on(t.player_id),
	],
);
