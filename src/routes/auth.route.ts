import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload";


const authRouter = Router();
const authController = new AuthController();

// 🔐 Auth routes
authRouter.post("/register", 
    upload.single("profile_picture"),
    authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authMiddleware, authController.logout);

// 👤 Current logged-in user
authRouter.get("/current-user", authMiddleware, authController.getMe)


export default authRouter;