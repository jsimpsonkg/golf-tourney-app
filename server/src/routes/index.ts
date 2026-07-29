import { Router } from "express";
import {
  getAllTournaments,
  getTournamentById,
  getMatchScores,
  createMatchScore,
  getSessionInfo,
  getTeamsInfo,
} from "./golf";
import {
  requirePassword,
  getAccessStatus,
  verifyPassword,
} from "../middleware/requirePassword";

const router = Router();

// The only unauthenticated routes — everything below them needs the password.
router.get("/access", getAccessStatus);
router.post("/access", verifyPassword);

router.use(requirePassword);

router.get("/tournaments", getAllTournaments);
router.get("/tournaments/:id", getTournamentById);
router.get("/tournaments/:id/rounds", getSessionInfo);
router.get("/tournaments/:id/teams/:teamId", getTeamsInfo);
router.get("/matches/:id/scores", getMatchScores);
router.post("/matches/:id/scores", createMatchScore);

export default router;
