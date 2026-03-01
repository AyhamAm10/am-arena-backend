import { ErrorMessages } from "./ErrorMessages";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "./http.error";
import { getLanguage, type Language } from "../../middlewares/lang.middleware";

export type { Language };

export class Ensure {
  private static getLang(): Language {
    return getLanguage();
  }

  static exists(value: any, entity: string) {
    if (!value) {
      throw new NotFoundError(
        ErrorMessages.generateErrorMessage(entity, "not found", this.getLang())
      );
    }
  }

  static required(value: any, entity: string) {
    if (value === undefined || value === null || value === "") {
      throw new BadRequestError(
        ErrorMessages.generateErrorMessage(entity, "required", this.getLang())
      );
    }
  }

  static min(value: string | number, min: number, entity: string) {
    if (
      (typeof value === "string" && value.length < min) ||
      (typeof value === "number" && value < min)
    ) {
      throw new BadRequestError(
        ErrorMessages.generateErrorMessage(entity, "min", this.getLang())
      );
    }
  }

  static unauthorized(condition: boolean, entity: string) {
    if (!condition) {
      throw new UnauthorizedError(
        ErrorMessages.generateErrorMessage(entity, "unauthorized", this.getLang())
      );
    }
  }

  static isNumber(value: any, entity: string) {
    if (typeof value !== "number" || isNaN(value)) {
      throw new BadRequestError(
        ErrorMessages.generateErrorMessage(entity, "bad request", this.getLang())
      );
    }
  }

  static forbidden(condition: boolean, entity: string) {
    if (!condition) {
      throw new ForbiddenError(
        ErrorMessages.generateErrorMessage(entity, "forbidden", this.getLang())
      );
    }
  }

  static custom(condition: boolean, message: string) {
    if (!condition) {
      throw new BadRequestError(message);
    }
  }

  static alreadyExists(condition: boolean, entity: string) {
    if (condition) {
      throw new BadRequestError(
        ErrorMessages.generateErrorMessage(entity, "already exists", this.getLang())
      );
    }
  }

  static isArray(value: any, entity: string) {
    if (!Array.isArray(value)) {
      throw new BadRequestError(
        ErrorMessages.generateErrorMessage(
          entity,
          "invalid",
          this.getLang()
        )
      );
    }
  }
}
