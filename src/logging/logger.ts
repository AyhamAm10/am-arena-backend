import * as winston from "winston";
import * as expressWinston from "express-winston";
import util from "util";

const format = winston.format;

function isProductionLog(): boolean {
  return process.env.NODE_ENV?.trim() === "production";
}

function buildConsoleFormat() {
  if (isProductionLog()) {
    return format.combine(
      format.timestamp(),
      format.errors({ stack: true }),
      format.json()
    );
  }

  return format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.timestamp(),
    format.printf((info) => {
      const { timestamp, level, message, stack, ...meta } = info;
      const ts = String(timestamp).slice(0, 19).replace("T", " ");
      let line = `${ts} [${level}]: ${message}`;
      const metaKeys = Object.keys(meta).filter(
        (k) => !k.startsWith("Symbol(")
      );
      if (metaKeys.length > 0) {
        const rest: Record<string, unknown> = {};
        for (const k of metaKeys) rest[k] = (meta as Record<string, unknown>)[k];
        line += ` ${util.inspect(rest, { depth: 8, colors: true, maxArrayLength: 20 })}`;
      }
      if (stack) line += `\n${stack}`;
      return line;
    })
  );
}

const loggerOptions = {
  level: "info",
  transports: [
    new winston.transports.Console({
      silent: process.argv.indexOf("--silent") >= 0,
    }),
  ],
  format: buildConsoleFormat(),
};

const expressLogger = expressWinston.logger(loggerOptions);
const logger = winston.createLogger(loggerOptions);

export { logger, expressLogger };
