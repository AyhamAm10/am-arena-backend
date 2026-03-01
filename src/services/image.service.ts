import fs from "fs";
import path from "path";
import { imageUrl } from "../utils/handle-generate-url";

export class ImageService {
  private uploadPath: string;

  constructor(uploadPath: string = "src/public/uploads/") {
    this.uploadPath = uploadPath;
  }


  getImageUrl(filename: string) {
    return imageUrl(filename);
  }

  async deleteImage(filename: string) {
    const filePath = path.join(this.uploadPath, filename);

    return new Promise<void>((resolve, reject) => {
      fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) return resolve(); 
        fs.unlink(filePath, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }
}
