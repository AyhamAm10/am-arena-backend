import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/best", userController.getBestUsers);
const updateProfileMiddleware = [
  upload.single("profile_picture"),
  authMiddleware,
  userController.updateProfile,
];
// POST: preferred for multipart file uploads (RN/axios reliably send body + boundary).
userRouter.post("/profile", ...updateProfileMiddleware);
// PATCH: kept for API compatibility.
userRouter.patch("/profile", ...updateProfileMiddleware);
userRouter.get("/:id/profile", userController.getUserProfile);

export default userRouter;
