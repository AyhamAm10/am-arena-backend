import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const userRouter = Router();
const userController = new UserController();

userRouter.get("/best", userController.getBestUsers);
userRouter.get("/:id/profile", userController.getUserProfile);

export default userRouter;
