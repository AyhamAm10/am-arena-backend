import { Router } from "express";
import { PubgTournamentController } from "../controllers/pubg-tournament.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import { upload } from "../middlewares/upload";
import {
  coinsStrictRateLimiter,
  publicReadHeavyRateLimiter,
} from "../middlewares/rate-limit/rate-limiters";

const pubgTournamentRouter = Router();
const pubgTournamentController = new PubgTournamentController();

pubgTournamentRouter.post("/", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), upload.single("image"), pubgTournamentController.createPubgTournament);
pubgTournamentRouter.patch("/:id", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), upload.single("image"), pubgTournamentController.updatePubgTournament);
pubgTournamentRouter.delete("/:id", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.deletePubgTournament);
pubgTournamentRouter.get("/",
    publicReadHeavyRateLimiter,
     pubgTournamentController.getPubgTournaments);
pubgTournamentRouter.get("/:id/registration-fields", publicReadHeavyRateLimiter, pubgTournamentController.getRegistrationFields);
pubgTournamentRouter.post(
  "/:id/register",
  coinsStrictRateLimiter,
  authMiddleware,
  pubgTournamentController.registerForTournament
);
pubgTournamentRouter.post("/:id/winners", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.assignWinners);
pubgTournamentRouter.post("/:id/survivors", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.assignSurvivors);
pubgTournamentRouter.get("/:id/registrations", authMiddleware, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), pubgTournamentController.getRegistrations);
pubgTournamentRouter.delete("/:id/registrations/:userId", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.removeRegistration);
pubgTournamentRouter.get("/:id",
      publicReadHeavyRateLimiter,
      pubgTournamentController.getPubgTournament);

export default pubgTournamentRouter;
