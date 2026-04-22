import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { PackageService } from "../services/repo/package/package.service";
import { validator } from "../common/errors/validator";
import {
  CreatePackageDto,
  createPackageSchema,
} from "../dto/package/create-package.dto";
import { HttpStatusCode } from "../common/errors/api.error";

export class PackageController {
  constructor() {
    this.getPackages = this.getPackages.bind(this);
    this.createPackage = this.createPackage.bind(this);
  }

  async getPackages(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const packageService = new PackageService();
      const data = await packageService.listActivePackages();
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("packages", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async createPackage(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(createPackageSchema, req.body)) as CreatePackageDto;
      const packageService = new PackageService();
      const data = await packageService.createPackage(dto);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("package", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
