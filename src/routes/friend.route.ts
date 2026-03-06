import { Router } from "express";
import { FriendController } from "../controllers/friend.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const friendRouter = Router();
const friendController = new FriendController();

friendRouter.post("/request", authMiddleware, friendController.sendRequest);
friendRouter.post("/accept", authMiddleware, friendController.acceptRequest);
friendRouter.get("/", authMiddleware, friendController.getFriends);
friendRouter.delete("/", authMiddleware, friendController.removeFriendship);

export default friendRouter;
