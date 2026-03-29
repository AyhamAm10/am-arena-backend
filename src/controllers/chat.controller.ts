import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  GetChannelsQueryDto,
  getChannelsQuerySchema,
} from "../dto/chat/get-channels-query.dto";
import { ChatService } from "../services/repo/chat/chat.service";

export class ChatController {
  constructor() {
    this.getPublicChannels = this.getPublicChannels.bind(this);
  }

  async getPublicChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const dto = (await validator(
        getChannelsQuerySchema,
        req.query
      )) as GetChannelsQueryDto;

      const chatService = new ChatService();
      const { data, total, page, limit } = await chatService.listChats(dto);

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("chats", "retrieved", lang),
          {
            count: total,
            page,
            limit,
          }
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
