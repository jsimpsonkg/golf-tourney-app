import { Router } from "express";
import {
	getAllTournaments,
	getTournamentById,
	getMatchScores,
	createMatchScore,
} from "./golf";

const router = Router();

router.get("/tournaments", getAllTournaments);
router.get("/tournaments/:id", getTournamentById);
router.get("/matches/:id/scores", getMatchScores);
router.post("/matches/:id/scores", createMatchScore);

export default router;
