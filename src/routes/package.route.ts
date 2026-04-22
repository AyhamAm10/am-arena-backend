import { Router } from "express";
import { PackageController } from "../controllers/package.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { checkRole } from "../middlewares/role.middleware";
import { UserRole } from "../entities/User";

const packageRouter = Router();
const packageController = new PackageController();

packageRouter.use(authMiddleware);
packageRouter.get("/", packageController.getPackages);
packageRouter.post(
  "/",
  checkRole([UserRole.ADMIN, UserRole.SUPER_ADMIN]),
  packageController.createPackage,
);

export default packageRouter;
