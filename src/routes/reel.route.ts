import { Router } from "express";
import { ReelController } from "../controllers/reel.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { optionalAuthMiddleware } from "../middlewares/optional-auth.middleware";
import {
  optionalReelVideoUploadMiddleware,
  reelVideoUploadMiddleware,
} from "../middlewares/reel-video-upload.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";

const reelRouter = Router();
const reelController = new ReelController();

reelRouter.post(
  "/",
  ...reelVideoUploadMiddleware,
  authMiddleware,
  reelController.createReel
);
reelRouter.get("/", optionalAuthMiddleware, reelController.getReels);
reelRouter.post("/:id/comment", authMiddleware, reelController.addComment);
reelRouter.get("/:id/comments", reelController.getReelComments);
reelRouter.get("/tag-users/search", authMiddleware, reelController.searchTagUsers);
reelRouter.post("/:id/like", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), reelController.likeReel);
reelRouter.delete("/:id/like", authMiddleware, reelController.removeLike);
reelRouter.patch(
  "/:id",
  ...optionalReelVideoUploadMiddleware,
  authMiddleware,
  checkRole([UserRole.SUPER_ADMIN]),
  reelController.updateReel
);
reelRouter.delete("/:id", authMiddleware, checkRole([UserRole.SUPER_ADMIN]), reelController.deleteReel);

export default reelRouter;
