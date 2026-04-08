import { Router } from "express";
import { NotificationController } from "../controllers/notification.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const notificationRouter = Router();
const notificationController = new NotificationController();

notificationRouter.get("/", authMiddleware, notificationController.listMine);
notificationRouter.patch("/:id/read", authMiddleware, notificationController.markRead);
notificationRouter.post("/push-token", authMiddleware, notificationController.registerPushToken);

export default notificationRouter;
