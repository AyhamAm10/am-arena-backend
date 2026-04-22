import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import { upload } from "../middlewares/upload";
import { optionalReelVideoUploadMiddleware } from "../middlewares/reel-video-upload.middleware";
import { coinsStrictRateLimiter } from "../middlewares/rate-limit/rate-limiters";

const adminRouter = Router();
const adminController = new AdminController();
const adminRoles = [UserRole.ADMIN, UserRole.SUPER_ADMIN];

adminRouter.use(authMiddleware, checkRole(adminRoles));

adminRouter.get("/users", adminController.getUsers);
adminRouter.patch("/users/:id/status", adminController.updateUserStatus);
adminRouter.patch("/users/:id/balance", adminController.updateUserBalance);
adminRouter.get("/dashboard/stats", adminController.getDashboardStats);

adminRouter.get("/channels", adminController.getChannels);
adminRouter.post("/channels", adminController.createChannel);
adminRouter.patch("/channels/:id", adminController.updateChannel);
adminRouter.delete("/channels/:id", adminController.deleteChannel);

adminRouter.post("/channels/:id/messages", adminController.sendChannelMessage);

adminRouter.get("/notifications", adminController.getNotifications);
adminRouter.post("/notifications", adminController.createNotification);
adminRouter.delete("/notifications/:id", adminController.deleteNotification);
adminRouter.get("/package-requests", adminController.getPackageRequests);
adminRouter.patch(
  "/package-requests/:id/approve",
  coinsStrictRateLimiter,
  adminController.approvePackageRequest
);
adminRouter.patch(
  "/package-requests/:id/reject",
  coinsStrictRateLimiter,
  adminController.rejectPackageRequest
);
adminRouter.post(
  "/manual-coins",
  coinsStrictRateLimiter,
  adminController.createManualCoins
);

adminRouter.patch("/reels/:id", ...optionalReelVideoUploadMiddleware, adminController.updateReel);
adminRouter.delete("/reels/:id", adminController.deleteReel);

adminRouter.get("/super-tournaments", adminController.getSuperTournaments);
adminRouter.post("/super-tournaments", upload.single("image"), adminController.createSuperTournament);
adminRouter.patch("/super-tournaments/:id", upload.single("image"), adminController.updateSuperTournament);
adminRouter.delete("/super-tournaments/:id", adminController.deleteSuperTournament);

export default adminRouter;
