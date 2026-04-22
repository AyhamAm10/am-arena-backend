import { NextFunction, Request, Response } from "express";
import { Ensure, Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  CreatePaymentRequestDto,
  createPaymentRequestSchema,
} from "../dto/payment/create-payment-request.dto";
import { PaymentService } from "../services/repo/payment/payment.service";
import { HttpStatusCode } from "../common/errors/api.error";

export class PaymentController {
  constructor() {
    this.createRequest = this.createRequest.bind(this);
  }

  async createRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = req.currentUser;
      Ensure.exists(userId, "user");
      const dto = (await validator(
        createPaymentRequestSchema,
        req.body,
      )) as CreatePaymentRequestDto;
      const paymentService = new PaymentService();
      const data = await paymentService.createPaymentRequest(userId!, dto);
      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("payment", "created", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
