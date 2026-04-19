import { Router } from "express";
import { ReelController } from "../controllers/reel.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { optionalAuthMiddleware } from "../middlewares/optional-auth.middleware";
import {
  optionalReelVideoUploadMiddleware,
  reelVideoUploadMiddleware,
} from "../middlewares/reel-video-upload.middleware";

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
reelRouter.post("/:id/like", authMiddleware, reelController.likeReel);
reelRouter.delete("/:id/like", authMiddleware, reelController.removeLike);
reelRouter.patch(
  "/:id",
  ...optionalReelVideoUploadMiddleware,
  authMiddleware,
  reelController.updateReel
);
reelRouter.delete("/:id", authMiddleware, reelController.deleteReel);

export default reelRouter;
