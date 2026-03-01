import express from "express";
import cors from "cors";
import * as path from "path";
import cookieParser from "cookie-parser";
import qs from "qs";
import fs from "fs";
import "reflect-metadata";
import { langMiddleware } from "./middlewares/lang.middleware";
import { errorHandler } from "./common/errors/error.handler";
import { swaggerDoc } from "./utils/swaggerOptions";


const app = express();

// CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  })
);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("query parser", (str) => qs.parse(str));

// Static files
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
ensureWritableDir(uploadsDir);
ensureWritableDir(iconsDir);

app.use("/image", express.static(uploadsDir));
app.use(cookieParser());

// Middlewares
app.use(langMiddleware);

// Routes
import { Router } from "express";
const router = Router();
router.get("/", (req, res) => {
  res.send("Our awesome Web API is online!");
});
app.use(process.env.BASE_URL ?? "/", router);

// Swagger
swaggerDoc(app);

// Error handler
app.use(errorHandler);

export { app };