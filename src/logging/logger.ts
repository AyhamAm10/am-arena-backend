import * as winston from "winston";
import * as expressWinston from "express-winston";

const format = winston.format;
const loggerOptions = {
  level: "info",
  transports: [
    new winston.transports.Console({
      silent: process.argv.indexOf("--silent") >= 0,
    }),
  ],

  format: winston.format.combine(
    format.errors({ stack: true }),
    format.colorize(),
    format.timestamp(),
    format.printf((info) => {
      const { timestamp, level, message, ...args } = info;

      const ts = (timestamp as any).slice(0, 19).replace("T", " ");
      return `${ts} [${level}]: ${message}`;
    })
  ),
};
const expressLogger = expressWinston.logger(loggerOptions);
const logger = winston.createLogger(loggerOptions);

export { logger, expressLogger };
