import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authMiddleware, optionalAuthMiddleware } from "../middlewares/auth.middleware";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/best", userController.getBestUsers);
const updateProfileMiddleware = [
  authMiddleware,
  userController.updateProfile,
];
userRouter.post("/profile", ...updateProfileMiddleware);
userRouter.patch("/profile", ...updateProfileMiddleware);
userRouter.get("/search", authMiddleware, userController.searchUsers);
userRouter.get("/:id/profile", optionalAuthMiddleware, userController.getUserProfile);

export default userRouter;
