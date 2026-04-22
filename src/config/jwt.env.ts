import { Environment } from "../environment";
import { logger } from "../logging/logger";

export function assertJwtSecretsOrExit(): void {
  if (Environment.isTest()) {
    return;
  }
  const access = process.env.ACCESS_TOKEN_SECRET?.trim();
  const refresh = process.env.REFRESH_TOKEN_SECRET?.trim();
  if (!access || !refresh) {
    logger.error(
      "ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must be set in the environment."
    );
    process.exit(1);
  }
  if (access.length < 32 || refresh.length < 32) {
    logger.error(
      "ACCESS_TOKEN_SECRET and REFRESH_TOKEN_SECRET must each be at least 32 characters."
    );
    process.exit(1);
  }
}
