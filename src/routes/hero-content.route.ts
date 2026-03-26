import { Router } from "express";
import { HeroContentController } from "../controllers/hero-content.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";
import { upload } from "../middlewares/upload";

const heroContentRouter = Router();
const heroContentController = new HeroContentController();
const adminRole = [UserRole.SUPER_ADMIN, UserRole.ADMIN];

heroContentRouter.get("/", heroContentController.getHeroContents);
heroContentRouter.get("/:id", heroContentController.getHeroContent);
heroContentRouter.post(
  "/",
  authMiddleware,
  checkRole(adminRole),
  upload.single("image"),
  heroContentController.createHeroContent
);
heroContentRouter.patch(
  "/:id",
  authMiddleware,
  checkRole(adminRole),
  heroContentController.updateHeroContent
);
heroContentRouter.delete(
  "/:id",
  authMiddleware,
  checkRole(adminRole),
  heroContentController.deleteHeroContent
);

export default heroContentRouter;
