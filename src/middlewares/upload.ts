import multer from "multer";
import path from "path";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import type { Request } from "express";
import type { StorageEngine } from "multer";
import type { UploadApiOptions } from "cloudinary";

const imageMimeTypes = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/heic",
  "image/heif",
];

function sanitizeFilename(originalName: string) {
  const ext = path.extname(originalName || "").toLowerCase();
  const base = path
    .basename(originalName || "file", ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60) || "file";
  return `${Date.now()}-${base}${ext}`;
}

let cloudinaryConfigured = false;
function ensureCloudinaryConfigured() {
  if (cloudinaryConfigured) return;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary environment variables are missing");
  }
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });
  cloudinaryConfigured = true;
}

class CloudinaryStorage implements StorageEngine {
  constructor(
    private readonly folder: string,
    private readonly resourceType: "image" | "video",
    private readonly options?: {
      sanitizeSvg?: boolean;
      optimizeRaster?: boolean;
    },
  ) {}

  _handleFile(
    _req: Request,
    file: any,
    cb: (error?: unknown, info?: Record<string, unknown>) => void
  ): void {
    ensureCloudinaryConfigured();
    const chunks: Buffer[] = [];
    file.stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    file.stream.on("error", (error) => cb(error));
    file.stream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      if (this.options?.sanitizeSvg && file.mimetype === "image/svg+xml") {
        const validationError = validateSvgContent(buffer);
        if (validationError) {
          cb(validationError);
          return;
        }
      }
      const publicId = sanitizeFilename(file.originalname).replace(/\.[^.]+$/, "");
      const uploadOptions: UploadApiOptions = {
        folder: this.folder,
        resource_type: this.resourceType,
        public_id: publicId,
      };

      const isRasterImage =
        this.resourceType === "image" &&
        file.mimetype !== "image/svg+xml" &&
        file.mimetype.startsWith("image/");

      if (this.options?.optimizeRaster && isRasterImage) {
        uploadOptions.transformation = [{ quality: "auto", fetch_format: "auto" }];
      }

      const upload = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error || !result) {
            cb(error || new Error("Cloudinary upload failed"));
            return;
          }
          const uploadResult = result as UploadApiResponse;
          cb(undefined, {
            filename: uploadResult.public_id,
            path: uploadResult.secure_url,
            size: uploadResult.bytes,
          });
        }
      );
      upload.end(buffer);
    });
  }

  _removeFile(
    _req: Request,
    file: any,
    cb: (error: Error | null) => void
  ): void {
    const publicId = file.filename || "";
    if (!publicId) {
      cb(null);
      return;
    }
    cloudinary.uploader
      .destroy(publicId, { resource_type: this.resourceType })
      .then(() => cb(null))
      .catch(() => cb(null));
  }
}

const imageFilter = (req, file, cb) => {
  if (imageMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

function validateSvgContent(buffer: Buffer): Error | null {
  const svg = buffer.toString("utf8");
  const normalized = svg.toLowerCase();

  const blockedPatterns: Array<{ pattern: RegExp; reason: string }> = [
    { pattern: /<script\b/i, reason: "script tags are not allowed" },
    { pattern: /\son[a-z]+\s*=/i, reason: "inline event handlers are not allowed" },
    {
      pattern: /\b(?:xlink:href|href)\s*=\s*["']\s*(?:https?:|\/\/|data:)/i,
      reason: "external or data URL references are not allowed",
    },
    { pattern: /<foreignobject\b/i, reason: "foreignObject is not allowed" },
  ];

  for (const check of blockedPatterns) {
    if (check.pattern.test(normalized)) {
      return new Error(`Unsafe SVG file rejected: ${check.reason}.`);
    }
  }

  if (!/<svg[\s>]/i.test(normalized)) {
    return new Error("Invalid SVG file content.");
  }

  return null;
}

const iconMimeTypes = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/svg+xml",
];

const iconFileFilter = (req, file, cb) => {
  if (iconMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only PNG, JPG, JPEG, WEBP, or SVG icon files are allowed!"), false);
};

const videoMimeTypes = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-msvideo",
  "video/3gpp",
];

const videoFilter = (req, file, cb) => {
  if (videoMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files are allowed!"), false);
  }
};

const imageStorage: StorageEngine = new CloudinaryStorage("uploads", "image", {
  optimizeRaster: true,
});
const iconStorage: StorageEngine = new CloudinaryStorage("icons", "image", {
  sanitizeSvg: true,
  optimizeRaster: true,
});
const videoStorage: StorageEngine = new CloudinaryStorage("reels", "video");

export const uploadIcon = multer({
  storage: iconStorage,
  fileFilter: iconFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

export const upload = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

export const uploadReelVideo = multer({
  storage: videoStorage,
  fileFilter: videoFilter,
  limits: { fileSize: 100 * 1024 * 1024 },
});


