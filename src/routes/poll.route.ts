import { Router } from "express";
import { PollController } from "../controllers/poll.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { optionalAuthMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";

const pollRouter = Router();
const pollController = new PollController();
const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

pollRouter.get("/tournament/:tournamentId", optionalAuthMiddleware, pollController.getTournamentPolls);
pollRouter.get("/chat/:chatId", optionalAuthMiddleware, pollController.getChatPolls);
pollRouter.get("/", optionalAuthMiddleware, pollController.listPolls);
pollRouter.get("/:id", optionalAuthMiddleware, pollController.getPollById);
pollRouter.post("/:id/vote", authMiddleware, pollController.castVote);

pollRouter.post(
  "/admin",
  authMiddleware,
  checkRole(adminRoles),
  pollController.createPoll,
);
pollRouter.patch(
  "/admin/:id",
  authMiddleware,
  checkRole(adminRoles),
  pollController.updatePoll,
);
pollRouter.delete(
  "/admin/:id",
  authMiddleware,
  checkRole(adminRoles),
  pollController.deletePoll,
);
pollRouter.post(
  "/admin/:id/options",
  authMiddleware,
  checkRole(adminRoles),
  pollController.addOption,
);
pollRouter.delete(
  "/admin/:id/options/:optionId",
  authMiddleware,
  checkRole(adminRoles),
  pollController.removeOption,
);
pollRouter.get(
  "/admin/:id/analytics",
  authMiddleware,
  checkRole(adminRoles),
  pollController.getAnalytics,
);
pollRouter.post(
  "/admin/:id/notify",
  authMiddleware,
  checkRole(adminRoles),
  pollController.notifyGlobalPoll,
);

export default pollRouter;
