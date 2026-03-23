import { Express } from "express";
import swaggerUi from "swagger-ui-express";
import * as fs from "fs";
import * as path from "path";
import yaml from "js-yaml";

const SWAGGER_DIR = path.resolve(process.cwd(), "swagger");
const PATHS_DIR = path.join(SWAGGER_DIR, "paths");
const PATH_FILES = [
  "auth",
  "friend",
  "achievement",
  "reel",
  "pubg-tournament",
  "user",
  "hero-content",
];

function loadSwaggerSpec(): object {
  const openapiPath = path.join(SWAGGER_DIR, "openapi.yaml");
  const baseContent = fs.readFileSync(openapiPath, "utf8");
  const spec = yaml.load(baseContent) as Record<string, unknown>;
  if (!spec.paths) {
    spec.paths = {};
  }
  const paths = spec.paths as Record<string, unknown>;

  for (const name of PATH_FILES) {
    const filePath = path.join(PATHS_DIR, `${name}.yaml`);
    if (!fs.existsSync(filePath)) continue;
    const content = fs.readFileSync(filePath, "utf8");
    const parsed = yaml.load(content) as Record<string, unknown>;
    if (parsed && typeof parsed === "object") {
      for (const key of Object.keys(parsed)) {
        paths[key] = parsed[key];
      }
    }
  }

  spec.paths = paths;
  return spec;
}

let swaggerSpec: object;
try {
  swaggerSpec = loadSwaggerSpec();
} catch {
  swaggerSpec = {
    openapi: "3.0.0",
    info: { title: "AM Arena Backend API", version: "1.0.0" },
    paths: {},
  };
}

function swaggerDoc(app: Express) {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

export { swaggerDoc };
