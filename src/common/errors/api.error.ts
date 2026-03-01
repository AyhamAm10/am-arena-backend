export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER = 500,
  USER_BLOCKED = 451,
}


export class BaseError extends Error {
  constructor(
    public readonly httpCode: HttpStatusCode,
    public readonly message: string,
    public readonly code?: number,
    public readonly description?: string,
    public readonly errorType?: string  
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }
}

export class APIError extends BaseError {
  constructor(
    httpCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER,
    message: string,
    code?: number,
    description?: string,
    errorType: string = "api_error"  
  ) {
    super(httpCode, message, code, description, errorType);
  }
}