import * as yup from "yup";
import { BadRequestError } from "./http.error";

export const validator = async <T extends yup.AnySchema>(
  schema: T,
  data: unknown
): Promise<yup.InferType<T>> => {
  try {
    
    return await schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });
  } catch (err) {
    if (err instanceof yup.ValidationError) {
      throw new BadRequestError(err.message);
    }
    throw err;
  }
};
