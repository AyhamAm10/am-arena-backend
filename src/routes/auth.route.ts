import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { authStrictRateLimiter } from "../middlewares/rate-limit/rate-limiters";

const authRouter = Router();
const authController = new AuthController();

// 🔐 Auth routes
authRouter.post("/register", authStrictRateLimiter, authController.register);
authRouter.post("/login", authStrictRateLimiter, authController.login);
authRouter.post("/refresh", authStrictRateLimiter, authController.refresh);
authRouter.post("/logout", authMiddleware, authController.logout);

// 👤 Current logged-in user
authRouter.get("/current-user", authMiddleware, authController.getMe)


export default authRouter;