import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;

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

  configured = true;
}

export function assertCloudinaryConfigOrExit() {
  ensureConfigured();
}

export class CloudinaryService {
  async destroyImage(publicId: string) {
    const trimmed = publicId.trim();
    if (!trimmed) return;

    ensureConfigured();
    await cloudinary.uploader.destroy(trimmed, { resource_type: "image" });
  }

  async destroyVideo(publicId: string) {
    const trimmed = publicId.trim();
    if (!trimmed) return;

    ensureConfigured();
    await cloudinary.uploader.destroy(trimmed, { resource_type: "video" });
  }
}
