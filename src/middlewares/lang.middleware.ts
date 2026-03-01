import { Request, Response, NextFunction } from "express";
import { AsyncLocalStorage } from "async_hooks";

export type Language = "en" | "ar";

const languageContext = new AsyncLocalStorage<Language>();

export function getLanguage(): Language {
  return languageContext.getStore() || "ar";
}

export function langMiddleware(req: Request, res: Response, next: NextFunction) {
  const acceptLanguage = req.headers["accept-language"] as string;
  let lang: Language = "en";

  if (acceptLanguage) {
    // Parse Accept-Language header (e.g., "en-US,en;q=0.9,ar;q=0.8")
    const languages = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0].trim().toLowerCase())
      .map((lang) => lang.split("-")[0]); // Extract primary language code

    // Check if Arabic is preferred
    if (languages.includes("ar")) {
      lang = "ar";
    } else if (languages.includes("en")) {
      lang = "en";
    }
  }

  languageContext.run(lang, () => {
    next();
  });
}

