// Resolves which course layout each round is played on. A tournament can span
// several venues (round 1 at one course, round 2 at another), so scoring can't
// assume "the tournament's 18 holes" — it has to ask per session.
import type { CourseHole, Session } from "@golf/shared";

export const groupHolesByCourse = (
  holes: CourseHole[],
): Map<string, CourseHole[]> => {
  const byCourse = new Map<string, CourseHole[]>();
  for (const h of holes) {
    const list = byCourse.get(h.course_id) ?? [];
    list.push(h);
    byCourse.set(h.course_id, list);
  }
  return byCourse;
};

// session id → that round's holes, in hole order. A session with no course of
// its own falls back to the tournament's only course, which keeps
// single-venue tournaments (and anything seeded before sessions had courses)
// working untouched.
export const holesBySession = (
  sessions: Session[],
  holes: CourseHole[],
): Map<string, CourseHole[]> => {
  const byCourse = groupHolesByCourse(holes);
  const courseIds = [...byCourse.keys()];
  const soleCourseId = courseIds.length === 1 ? courseIds[0]! : null;

  const out = new Map<string, CourseHole[]>();
  for (const s of sessions) {
    const courseId = s.course_id ?? soleCourseId;
    out.set(s.id, (courseId ? byCourse.get(courseId) : undefined) ?? []);
  }
  return out;
};
