import { Router } from "express";
import {
	getAllTournaments,
	getTournamentById,
	createMatchScore,
} from "@services/golf";

const router = Router();

router.get("/tournaments", getAllTournaments);
router.get("/tournaments/:id", getTournamentById);
router.post("/matches/:id/scores", createMatchScore);

export default router;
