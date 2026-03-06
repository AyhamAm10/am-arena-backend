import { Router } from "express";
import { ReelController } from "../controllers/reel.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const reelRouter = Router();
const reelController = new ReelController();

reelRouter.post("/", authMiddleware, reelController.createReel);
reelRouter.get("/", reelController.getReels);
reelRouter.post("/:id/comment", authMiddleware, reelController.addComment);
reelRouter.get("/:id/comments", reelController.getReelComments);
reelRouter.post("/:id/like", authMiddleware, reelController.likeReel);
reelRouter.delete("/:id/like", authMiddleware, reelController.removeLike);

export default reelRouter;
