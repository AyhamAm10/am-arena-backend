import { NextFunction, Request, Response } from "express";
import { Ensure, Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  GetWalletTransactionsQueryDto,
  getWalletTransactionsQuerySchema,
} from "../dto/wallet/get-wallet-transactions-query.dto";
import { WalletService } from "../services/repo/wallet/wallet.service";

export class WalletController {
  constructor() {
    this.getMyWallet = this.getMyWallet.bind(this);
    this.getMyTransactions = this.getMyTransactions.bind(this);
  }

  async getMyWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = req.currentUser;
      Ensure.exists(userId, "user");
      const walletService = new WalletService();
      const data = await walletService.getMyWallet(userId!);
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("wallet", "retrieved", lang),
        ),
      );
    } catch (error) {
      next(error);
    }
  }

  async getMyTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = req.currentUser;
      Ensure.exists(userId, "user");
      const dto = (await validator(
        getWalletTransactionsQuerySchema,
        req.query,
      )) as GetWalletTransactionsQueryDto;
      const walletService = new WalletService();
      const { data, total, page, limit } = await walletService.getMyTransactions(
        userId!,
        dto,
      );
      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("wallet transactions", "retrieved", lang),
          { count: total, page, limit },
        ),
      );
    } catch (error) {
      next(error);
    }
  }
}
