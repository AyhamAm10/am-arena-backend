import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";


const authRouter = Router();
const authController = new AuthController();

// 🔐 Auth routes
authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/logout", authMiddleware, authController.logout)

// 👤 Current logged-in user
authRouter.get("/current-user", authMiddleware, authController.getMe)


export default authRouter;