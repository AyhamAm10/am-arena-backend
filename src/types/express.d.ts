import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      id?: string;  
      currentUser?: number;
      file?: Express.Multer.File;
      /** Set by reel video upload middleware; stored as Reel.video_url */
      reelVideoUrl?: string;
      /** Cloudinary public_id for uploaded reel video (optional). */
      reelVideoPublicId?: string;
    }
  }
}