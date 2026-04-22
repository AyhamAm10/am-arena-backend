import { NextFunction, Request, Response } from "express";
import { APIError, HttpStatusCode } from "../common/errors/api.error";
import { uploadReelVideo } from "./upload";

/** Same as create upload but does not require a file (for PATCH reel). */
export const optionalReelVideoUploadMiddleware: Array<
  (req: Request, res: Response, next: NextFunction) => void
> = [
  uploadReelVideo.single("video"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      req.reelVideoUrl = req.file.path as string;
      req.reelVideoPublicId = req.file.filename as string;
    }

    next();
  },
];

/**
 * Parses multipart/form-data, uploads the `video` file to Cloudinary,
 * and sets `req.reelVideoUrl` / `req.reelVideoPublicId` from the upload result.
 */
export const reelVideoUploadMiddleware: Array<
  (req: Request, res: Response, next: NextFunction) => void
> = [
  uploadReelVideo.single("video"),
  (req: Request, res: Response, next: NextFunction) => {
    const file = req.file;
    if (!file) {
      return next(
        new APIError(HttpStatusCode.BAD_REQUEST, "Video file is required")
      );
    }
    req.reelVideoUrl = file.path as string;
    req.reelVideoPublicId = file.filename as string;
    next();
  },
];
