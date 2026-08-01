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
	check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

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
	session_type: text("session_type"), // e.g. 'foursomes', 'fourball', 'singles', 'scramble'
	// Which course this round is played on. Nullable so a single-venue
	// tournament can leave it unset and fall back to its only course.
	course_id: uuid("course_id").references(() => courses.id),
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
	// Per-match overrides, for a round that mixes formats — e.g. a day of two
	// 2v2 matches worth 2 points plus one singles worth 1 is still one session
	// (one tab in the UI). Null on either means "inherit from the session".
	match_type: text("match_type"),
	point_value: numeric("point_value", { precision: 4, scale: 2 }),
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

export const courses = pgTable(
	"courses",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		name: text("name"),
	}
);

export const course_holes = pgTable(
	"course_holes",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		tournament_id: uuid("tournament_id")
			.references(() => tournaments.id, { onDelete: "cascade" })
			.notNull(),
		// Holes belong to a course, not a tournament — that's what lets one
		// tournament play two different venues across its rounds.
		course_id: uuid("course_id")
			.references(() => courses.id, { onDelete: "cascade" })
			.notNull(),
		hole_number: integer("hole_number").notNull(),
		par: integer("par").notNull(),
		stroke_index: integer("stroke_index"), // hole difficulty ranking, for net/handicap play
		yardage: integer("yardage"),
	},
	(t) => [
		uniqueIndex("course_holes_course_hole_unq").on(t.course_id, t.hole_number),
		index("course_holes_tournament_idx").on(t.tournament_id),
	],
);

export const score_entries = pgTable(
	"score_entries",
	{
		id: uuid("id").defaultRandom().primaryKey(),
		player_id: uuid("player_id")
			.references(() => players.id, { onDelete: "cascade" }),
		team_id: uuid("team_id").references(() => teams.id, {onDelete: "cascade"}),
		match_id: uuid("match_id").references(() => matches.id, { onDelete: "cascade" }),
		hole_number: integer("hole_number").notNull(),
		strokes: integer("strokes").notNull(),
		created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
	},
	(t) => [
		uniqueIndex("score_entries_player_match_hole_unq")
			.on(t.player_id, t.match_id, t.hole_number)
			.where(sql`${t.player_id} IS NOT NULL`),

		uniqueIndex("score_entries_team_match_hole_unq")
			.on(t.team_id, t.match_id, t.hole_number)
			.where(sql`${t.team_id} IS NOT NULL`),

		index("score_entries_match_idx").on(t.match_id),
		index("score_entries_player_idx").on(t.player_id),

		check("score_entries_player_xor_team_chk",
			sql`(${t.player_id} IS NOT NULL) != (${t.team_id} IS NOT NULL)`,
		),
	],
);
