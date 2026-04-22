import multer from "multer";
import path from "path";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import type { Request } from "express";
import type { StorageEngine } from "multer";

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
      const publicId = sanitizeFilename(file.originalname).replace(/\.[^.]+$/, "");
      const upload = cloudinary.uploader.upload_stream(
        {
          folder: this.folder,
          resource_type: this.resourceType,
          public_id: publicId,
        },
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

const iconMimeTypes = [...imageMimeTypes];

/** Achievement icons: raster images only (SVG disabled for XSS hardening). */
const iconFileFilter = (req, file, cb) => {
  if (iconMimeTypes.includes(file.mimetype)) {
    cb(null, true);
    return;
  }
  cb(new Error("Only raster image icon files are allowed!"), false);
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

const imageStorage: StorageEngine = new CloudinaryStorage("uploads", "image");
const iconStorage: StorageEngine = new CloudinaryStorage("icons", "image");
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


