import { Router } from "express";
import { AchievementController } from "../controllers/achievement.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import { uploadIcon } from "../middlewares/upload";

const achievementRouter = Router();
const achievementController = new AchievementController();
const adminRole = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

achievementRouter.post(
  "/",
  authMiddleware,
  checkRole(adminRole),
  uploadIcon.single("icon"),
  achievementController.createAchievement
);
achievementRouter.patch(
  "/:id",
  authMiddleware,
  checkRole(adminRole),
  achievementController.updateAchievement
);
achievementRouter.delete(
  "/:id",
  authMiddleware,
  checkRole(adminRole),
  achievementController.deleteAchievement
);
achievementRouter.get("/", authMiddleware, achievementController.getAchievements);
achievementRouter.post(
  "/:id/assign",
  authMiddleware,
  checkRole(adminRole),
  achievementController.assignToUser
);

export default achievementRouter;
