type EnvType = 'development' | 'production' | 'test';

export class Environment {
  private static currentEnv(): EnvType {
    const value = process.env.NODE_ENV?.trim();
    if (value === "development" || value === "production" || value === "test") {
      return value;
    }
    throw new Error(
      "NODE_ENV must be explicitly set to one of: development, production, test."
    );
  }

  static isDevelopment() { return this.currentEnv() === 'development'; }
  static isProduction() { return this.currentEnv() === 'production'; }
  static isTest() { return this.currentEnv() === 'test'; }
  static toString() { return this.currentEnv(); }
}
