import { Router } from "express";
import { WalletController } from "../controllers/wallet.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const walletRouter = Router();
const walletController = new WalletController();

walletRouter.use(authMiddleware);
walletRouter.get("/me", walletController.getMyWallet);
walletRouter.get("/transactions", walletController.getMyTransactions);

export default walletRouter;
