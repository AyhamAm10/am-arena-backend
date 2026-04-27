import { NextFunction, Request, Response } from "express";
import { logger } from "../../logging/logger";
import { formatErrorForLog, redactSecretsInText } from "../../logging/errorDiagnostics";
import { APIError, HttpStatusCode } from "./api.error";
import { HttpError } from "./http.error";
import util from "util";

function safeLogMessage(message: string, maxLen = 500): string {
  const s = message.replace(/\s+/g, " ").trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

function safeHttpDetails(details: unknown): unknown {
  if (details === null || details === undefined) return details;
  if (typeof details === "string") {
    return redactSecretsInText(details.slice(0, 2000));
  }
  if (typeof details === "object") {
    try {
      const raw = util.inspect(details, { depth: 4, maxArrayLength: 30 });
      return redactSecretsInText(raw.slice(0, 4000));
    } catch {
      return "[unserializable details]";
    }
  }
  return details;
}

function logHttpError(
  error: Error,
  req: Request,
  kind: "api_error" | "http_error" | "unhandled"
): void {
  const err = formatErrorForLog(error);
  if (error instanceof APIError) {
    Object.assign(err, {
      httpCode: error.httpCode,
      apiCode: error.code,
      apiDescription: error.description,
      errorType: error.errorType,
    });
  }
  if (error instanceof HttpError) {
    Object.assign(err, {
      httpStatus: error.statusCode,
      httpDetails: safeHttpDetails(error.details),
    });
  }

  const payload = {
    event: "http_request_error",
    kind,
    http: {
      method: req.method,
      path: safeLogMessage(req.url, 2048),
    },
    err,
  };

  logger.log({
    level: "error",
    message: "http_request_error",
    ...payload,
  });
}

const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error instanceof APIError) {
    logHttpError(error, req, "api_error");
    return res.status(error.httpCode).json({
      success: false,
      code: error.code,
      message: error.message,
      description: error.description,
      error: error.name,
    });
  }

  if (error instanceof HttpError) {
    logHttpError(error, req, "http_error");
    return res.status(error.statusCode).json({
      success: false,
      status: error.statusCode,
      message: error.message,
      error: error.name,
      details: error.details,
    });
  }

  logHttpError(error, req, "unhandled");

  return res.status(HttpStatusCode.INTERNAL_SERVER).json({
    success: false,
    message: "Internal server error",
    error:
      process.env.NODE_ENV === "production" ? "Server Error" : error.message,
  });
};

export { errorHandler };
