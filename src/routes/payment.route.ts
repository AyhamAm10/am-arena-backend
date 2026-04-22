import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { coinsStrictRateLimiter } from "../middlewares/rate-limit/rate-limiters";

const paymentRouter = Router();
const paymentController = new PaymentController();

paymentRouter.use(coinsStrictRateLimiter);
paymentRouter.use(authMiddleware);
paymentRouter.post("/request", paymentController.createRequest);

export default paymentRouter;
