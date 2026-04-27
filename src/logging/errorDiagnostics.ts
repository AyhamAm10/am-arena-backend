import { QueryFailedError } from "typeorm";
import util from "util";

const MAX_TEXT = 8000;
const MAX_QUERY = 12000;

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…(truncated,len=${s.length})`;
}

/**
 * Redact common secret patterns from log text (queries, messages, stacks).
 */
export function redactSecretsInText(text: string): string {
  let t = text;
  t = t.replace(/Bearer\s+[\w-_.+/=]+/gi, "Bearer [REDACTED]");
  t = t.replace(
    /("refreshToken"|"accessToken"|"password"|"token"|"secret"|"authorization")\s*:\s*"[^"]*"/gi,
    '$1:"[REDACTED]"'
  );
  t = t.replace(/password\s*=\s*[^\s,)]+/gi, "password=[REDACTED]");
  return t;
}

function pickDriverErrorFields(driverError: unknown): Record<string, unknown> {
  if (driverError == null) return {};
  if (driverError instanceof Error) {
    const anyErr = driverError as Error & {
      code?: string | number;
      number?: number;
    };
    return {
      driverMessage: redactSecretsInText(driverError.message),
      ...(anyErr.code !== undefined ? { driverCode: anyErr.code } : {}),
      ...(anyErr.number !== undefined ? { driverNumber: anyErr.number } : {}),
    };
  }
  if (typeof driverError === "object") {
    const o = driverError as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    const keys = ["message", "code", "number", "errno", "sqlState", "state"] as const;
    for (const key of keys) {
      if (!(key in o) || o[key] == null) continue;
      const v = o[key];
      out[`driver_${key}`] =
        typeof v === "string" ? redactSecretsInText(v) : v;
    }
    return out;
  }
  return { driverError: String(driverError) };
}

function serializeCause(cause: unknown): Record<string, unknown> | undefined {
  if (cause === undefined || cause === null) return undefined;
  return formatErrorForLog(cause);
}

/**
 * Plain-object error details for structured logs (Winston JSON, Azure App Service).
 * Omits TypeORM bound parameter values; surfaces driver/DB messages and query text.
 */
export function formatErrorForLog(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    const base: Record<string, unknown> = {
      name: error.name,
      message: truncate(redactSecretsInText(error.message), MAX_TEXT),
    };
    if (error.stack) {
      base.stack = truncate(redactSecretsInText(error.stack), MAX_TEXT);
    }

    if (error instanceof QueryFailedError) {
      base.typeorm = {
        failedQuery: truncate(redactSecretsInText(error.query), MAX_QUERY),
        parameterCount: error.parameters?.length ?? 0,
        ...pickDriverErrorFields(error.driverError),
      };
    }

    const cause = (error as Error & { cause?: unknown }).cause;
    const c = serializeCause(cause);
    if (c) base.cause = c;

    // yup.ValidationError and similar: surface paths without dumping full input
    const anyErr = error as Error & { errors?: unknown[]; inner?: unknown[] };
    if (Array.isArray(anyErr.errors) && anyErr.errors.length) {
      base.validationErrors = anyErr.errors.map((e) =>
        typeof e === "string" ? e : util.inspect(e, { depth: 3 })
      );
    }
    if (Array.isArray(anyErr.inner) && anyErr.inner.length) {
      base.validationInner = anyErr.inner.map((e) => formatErrorForLog(e));
    }

    return base;
  }

  if (typeof error === "object" && error !== null) {
    try {
      return { nonErrorObject: true, summary: redactSecretsInText(util.inspect(error, { depth: 5 })) };
    } catch {
      return { nonErrorObject: true };
    }
  }

  return { nonError: true, value: redactSecretsInText(String(error)) };
}
