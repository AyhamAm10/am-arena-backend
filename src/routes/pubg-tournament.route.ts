import { Router } from "express";
import { PubgTournamentController } from "../controllers/pubg-tournament.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import { upload } from "../middlewares/upload";

const pubgTournamentRouter = Router();
const pubgTournamentController = new PubgTournamentController();

pubgTournamentRouter.post("/", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), upload.single("image"), pubgTournamentController.createPubgTournament);
pubgTournamentRouter.patch("/:id", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), upload.single("image"), pubgTournamentController.updatePubgTournament);
pubgTournamentRouter.delete("/:id", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.deletePubgTournament);
pubgTournamentRouter.get("/",
    //  authMiddleware, 
     pubgTournamentController.getPubgTournaments);
pubgTournamentRouter.get("/:id/registration-fields", pubgTournamentController.getRegistrationFields);
pubgTournamentRouter.post("/:id/register", authMiddleware, pubgTournamentController.registerForTournament);
pubgTournamentRouter.post("/:id/winners", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.assignWinners);
pubgTournamentRouter.get("/:id/registrations", authMiddleware, checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]), pubgTournamentController.getRegistrations);
pubgTournamentRouter.delete("/:id/registrations/:userId", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), pubgTournamentController.removeRegistration);
pubgTournamentRouter.get("/:id",
    //  authMiddleware,
      pubgTournamentController.getPubgTournament);

export default pubgTournamentRouter;
