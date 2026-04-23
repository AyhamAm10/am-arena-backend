import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import cookieParser from "cookie-parser";
import qs from "qs";
import { Server as SocketIOServer } from "socket.io";
import { Environment } from "./environment";
import { logger } from "./logging/logger";
import { AppDataSource } from "./config/data_source";
import { errorHandler } from "./common/errors/error.handler";
// import passport from "./utils/passport";
import { swaggerDoc } from "./utils/swaggerOptions";
import { langMiddleware } from "./middlewares/lang.middleware";
import "reflect-metadata";
import { createSuperAdmin } from "./config/createSuperAdmin";
import authRouter from "./routes/auth.route";
import pubgTournamentRouter from "./routes/pubg-tournament.route";
import friendRouter from "./routes/friend.route";
import achievementRouter from "./routes/achievement.route";
import reelRouter from "./routes/reel.route";
import userRouter from "./routes/user.route";
import heroContentRouter from "./routes/hero-content.route";
import chatRouter from "./routes/chat.route";
import adminRouter from "./routes/admin.route";
import notificationRouter from "./routes/notification.route";
import pollRouter from "./routes/poll.route";
import walletRouter from "./routes/wallet.route";
import packageRouter from "./routes/package.route";
import paymentRouter from "./routes/payment.route";
// import { registerChatGateway } from "./socket/chat.gateway";
import { configureSocketAdapter, setIO } from "./socket/io";
import { registerChatGateway } from "./socket/chat.gateway";
import {
  assertRateLimitRedisOrExit,
  globalRateLimiter,
} from "./middlewares/rate-limit/rate-limiters";
import { assertJwtSecretsOrExit } from "./config/jwt.env";
import { assertCloudinaryConfigOrExit } from "./services/cloudinary.service";

dotenv.config();
assertJwtSecretsOrExit();
assertRateLimitRedisOrExit();
assertCloudinaryConfigOrExit();

const app = express();
const httpServer = http.createServer(app);

if (process.env.TRUST_PROXY === "1") {
  app.set("trust proxy", 1);
}

const corsOriginsEnv = process.env.CORS_ORIGINS?.trim();
const configuredCorsOrigins =
  corsOriginsEnv && corsOriginsEnv.length > 0
    ? corsOriginsEnv.split(",").map((o) => o.trim()).filter(Boolean)
    : [];

const strictProductionCors = process.env.STRICT_PRODUCTION_CORS === "1";

if (
  strictProductionCors &&
  Environment.isProduction() &&
  configuredCorsOrigins.length === 0
) {
  logger.error(
    "CORS_ORIGINS is required in production. Refusing to start with wildcard origins."
  );
  process.exit(1);
}

// TEMPORARY: permissive CORS for development/testing. Restrict before production deployment.
const useTemporaryWildcardCors =
  !strictProductionCors || !Environment.isProduction();

const corsOrigin = useTemporaryWildcardCors
  ? "*"
  : configuredCorsOrigins.length > 0
    ? configuredCorsOrigins
    : [];

const corsCredentials = corsOrigin === "*" ? false : true;

app.use(
  cors({
    origin: corsOrigin,
    credentials: corsCredentials,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept-Language",
      "X-Refresh-Token-Delivery",
    ],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());
app.set("query parser", (str) => qs.parse(str));

app.use(cookieParser());
// Apply language middleware before routes
app.use(langMiddleware);

const router = express.Router();
router.use(globalRateLimiter);

router.get("/", (req, res) => {
  res.send("Our awesome Web API is online!");
});

router.use("/auth", authRouter);
router.use("/pubg-tournament", pubgTournamentRouter);
router.use("/friend", friendRouter);
router.use("/achievement", achievementRouter);
router.use("/reel", reelRouter);
router.use("/user", userRouter);
router.use("/hero-content", heroContentRouter);
router.use("/chat", chatRouter);
router.use("/admin", adminRouter);
router.use("/notification", notificationRouter);
router.use("/poll", pollRouter);
router.use("/wallet", walletRouter);
router.use("/package", packageRouter);
router.use("/payment", paymentRouter);

app.use(process.env.BASE_URL ?? "/", router);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

const io = new SocketIOServer(httpServer, {
  cors: {
    origin: corsOrigin,
    credentials: corsCredentials,
    methods: ["GET", "POST"],
  },
});

setIO(io);
void configureSocketAdapter(io);
registerChatGateway(io);

if (!Environment.isProduction()) {
  swaggerDoc(app);
}

logger.info(`NODE_ENV: ${Environment.toString()}`);

if (Environment.isDevelopment() || Environment.isProduction()) {
  AppDataSource.initialize()
    .then(async (connection) => {
      logger.info(
        `Database connection status: ${
          connection.isInitialized ? "Connected" : "Not Connected"
        }`
      );

      try {
        await createSuperAdmin();
      } catch (error) {
        logger.error("Failed to create super admin:", error);
      }

      httpServer.listen(PORT, "0.0.0.0", () => {
        logger.info(`Server running on 0.0.0.0:${PORT}`);
      });
    })
    .catch((error: Error) => {
      logger.error(error);
    });
}

export { app, io };
