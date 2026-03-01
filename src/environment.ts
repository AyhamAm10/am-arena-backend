type EnvType = 'development' | 'production' | 'test';

export class Environment {
  static _env: EnvType = (process.env.NODE_ENV?.trim() as EnvType) || 'development';

  static isDevelopment() { return this._env === 'development'; }
  static isProduction() { return this._env === 'production'; }
  static isTest() { return this._env === 'test'; }
  static toString() { return this._env; }
}
