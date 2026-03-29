import { NextFunction, Request, Response } from "express";
import { APIError, HttpStatusCode } from "../common/errors/api.error";
import { imageUrl } from "../utils/handle-generate-url";
import { uploadReelVideo } from "./upload";

/** Same as create upload but does not require a file (for PATCH reel). */
export const optionalReelVideoUploadMiddleware: Array<
  (req: Request, res: Response, next: NextFunction) => void
> = [
  uploadReelVideo.single("video"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      req.reelVideoUrl = imageUrl(req.file.filename);
    }

    next();
  },
];

/**
 * Parses multipart/form-data, saves the `video` file under public/uploads,
 * and sets `req.reelVideoUrl` to the same relative path shape as profile images (`image/...`).
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
    req.reelVideoUrl = imageUrl(file.filename);
    next();
  },
];
