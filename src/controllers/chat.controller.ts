import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import {
  GetChannelsQueryDto,
  getChannelsQuerySchema,
} from "../dto/chat/get-channels-query.dto";
import { getMessagesQuerySchema } from "../dto/chat/get-messages-query.dto";
import { adminIdParamsSchema } from "../dto/admin/admin-chat.dto";
import { ChatService } from "../services/repo/chat/chat.service";
import { MessageService } from "../services/repo/message/message.service";

export class ChatController {
  private readonly messageService = new MessageService();

  constructor() {
    this.getPublicChannels = this.getPublicChannels.bind(this);
    this.getChannelMessages = this.getChannelMessages.bind(this);
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

  async getChannelMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const params = await validator(adminIdParamsSchema, req.params);
      const query = await validator(getMessagesQuerySchema, req.query);

      const { data, total, page, limit } = await this.messageService.listByChat(
        params.id,
        query.page,
        query.limit,
      );

      return res.json(
        ApiResponse.success(
          data,
          ErrorMessages.generateErrorMessage("messages", "retrieved", lang),
          { count: total, page, limit },
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
