import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      id?: string;  
      currentUser?: number;
      file?: Express.Multer.File;
    }
  }
}