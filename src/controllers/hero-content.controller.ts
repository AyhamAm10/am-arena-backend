import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  CreateHeroContentDto,
  createHeroContentSchema,
} from "../dto/hero-content/create-hero-content.dto";
import {
  UpdateHeroContentDto,
  updateHeroContentSchema,
} from "../dto/hero-content/update-hero-content.dto";
import {
  GetHeroContentQueryDto,
  getHeroContentQuerySchema,
} from "../dto/hero-content/get-hero-content-query.dto";
import {
  HeroContentIdParamsDto,
  heroContentIdParamsSchema,
} from "../dto/hero-content/hero-content-id-params.dto";
import { HeroContentService } from "../services/repo/hero-content/hero-content.service";

export class HeroContentController {
  constructor() {
    this.createHeroContent = this.createHeroContent.bind(this);
    this.updateHeroContent = this.updateHeroContent.bind(this);
    this.deleteHeroContent = this.deleteHeroContent.bind(this);
    this.getHeroContent = this.getHeroContent.bind(this);
    this.getHeroContents = this.getHeroContents.bind(this);
  }

  async createHeroContent(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      await validator(createHeroContentSchema, req.body);
      const dto = req.body as CreateHeroContentDto;

      const heroContentService = new HeroContentService();
      const row = await heroContentService.createHeroContent({
        ...dto,
        image_url: req.file?.path as string,
      });

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          row,
          ErrorMessages.generateErrorMessage("hero content", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async updateHeroContent(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      await validator(updateHeroContentSchema, req.body);
      const dto = req.body as UpdateHeroContentDto;
      const params = (await validator(
        heroContentIdParamsSchema,
        req.params
      )) as HeroContentIdParamsDto;

      const heroContentService = new HeroContentService();
      const row = await heroContentService.updateHeroContent(params.id, dto);

      return res.json(
        ApiResponse.success(
          row,
          ErrorMessages.generateErrorMessage("hero content", "updated", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async deleteHeroContent(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const params = (await validator(
        heroContentIdParamsSchema,
        req.params
      )) as HeroContentIdParamsDto;

      const heroContentService = new HeroContentService();
      await heroContentService.deleteHeroContent(params.id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("hero content", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getHeroContent(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const params = (await validator(
        heroContentIdParamsSchema,
        req.params
      )) as HeroContentIdParamsDto;

      const heroContentService = new HeroContentService();
      const row = await heroContentService.getHeroContent(params.id);

      return res.json(
        ApiResponse.success(
          row,
          ErrorMessages.generateErrorMessage("hero content", "retrieved", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getHeroContents(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";

      const dto = (await validator(
        getHeroContentQuerySchema,
        req.query
      )) as GetHeroContentQueryDto;

      const heroContentService = new HeroContentService();
      const { data, total, page, limit } =
        await heroContentService.getHeroContents(dto);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("hero content", "retrieved", lang),
          {
            count: total,
            page,
            limit,
          }
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
