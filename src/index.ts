import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import * as path from "path";
import cookieParser from "cookie-parser";
import qs from "qs";
import { Environment } from "./environment";
import { logger } from "./logging/logger";
import { AppDataSource } from "./config/data_source";
import { errorHandler } from "./common/errors/error.handler";
// import passport from "./utils/passport";
import fs from "fs";
import { swaggerDoc } from "./utils/swaggerOptions";
import { langMiddleware } from "./middlewares/lang.middleware";
import "reflect-metadata";
import { createSuperAdmin } from "./config/createSuperAdmin";
import authRouter from "./routes/auth.route";
dotenv.config();
const app = express();

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(passport.initialize());
app.set("query parser", (str) => qs.parse(str));

function ensureWritableDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true });

  const testFile = path.join(dir, ".write-test");
  try {
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
  } catch (e) {
    throw new Error(`Uploads dir not writable: ${dir}`);
  }
}
const uploadsDir = path.resolve(process.cwd(), "public/uploads");
const iconsDir = path.resolve(process.cwd(), "public/icons");

try {
  ensureWritableDir(uploadsDir);
  ensureWritableDir(iconsDir);
} catch (e) {
  logger.error(e);
  process.exit(1);
}

// app.use("/image", express.static(path.join(process.cwd(), "public/uploads")));
app.use("/image", express.static(uploadsDir));
app.use(cookieParser());
// Apply language middleware before routes
app.use(langMiddleware);

const router = express.Router();
router.get("/", (req, res) => {
  res.send("Our awesome Web API is online!");
});

router.use("/auth" , authRouter)

app.use(process.env.BASE_URL ?? "/", router);

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

swaggerDoc(app);

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

      app.listen(PORT, "0.0.0.0", () => {
        logger.info(`Server running at http://localhost:${PORT}`);
      });
    })
    .catch((error: Error) => {
      logger.error(error);
    });
}

export { app };


// import dotenv from "dotenv";
// dotenv.config();

// import { app } from "./app";
// import { AppDataSource } from "./config/data_source";
// import { logger } from "./logging/logger";
// import { createSuperAdmin } from "./config/createSuperAdmin";
// import { Environment } from "./environment";

// const PORT = Number(process.env.PORT) || 5000;

// if (Environment.isDevelopment() || Environment.isProduction()) {
//   AppDataSource.initialize()
//     .then(async (connection) => {
//       logger.info(
//         `Database connection status: ${
//           connection.isInitialized ? "Connected" : "Not Connected"
//         }`
//       );

//       try {
//         await createSuperAdmin();
//       } catch (error) {
//         logger.error("Failed to create super admin:", error);
//       }

//       app.listen(PORT, "0.0.0.0", () => {
//         logger.info(`Server running at http://localhost:${PORT}`);
//       });
//     })
//     .catch((error: Error) => {
//       logger.error(error);
//     });
// }