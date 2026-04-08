import { Router } from "express";
import { ChatController } from "../controllers/chat.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const chatRouter = Router();
const chatController = new ChatController();

chatRouter.get("/channels", authMiddleware, chatController.getPublicChannels);
chatRouter.get("/channels/:id/messages", authMiddleware, chatController.getChannelMessages);

export default chatRouter;
