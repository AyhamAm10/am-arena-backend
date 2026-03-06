import { NextFunction, Request, Response } from "express";
import { Language } from "../common/errors/Ensure.handler";
import { ApiResponse } from "../common/responses/api.response";
import { HttpStatusCode } from "../common/errors/api.error";
import { ErrorMessages } from "../common/errors/ErrorMessages";
import { validator } from "../common/errors/validator";
import { SendFriendRequestDto, sendFriendRequestSchema } from "../dto/friend/send-friend-request.dto";
import { AcceptFriendRequestDto, acceptFriendRequestSchema } from "../dto/friend/accept-friend-request.dto";
import { GetFriendsQueryDto, getFriendsQuerySchema } from "../dto/friend/get-friends-query.dto";
import { RemoveFriendshipDto, removeFriendshipSchema } from "../dto/friend/remove-friendship.dto";
import { FriendService } from "../services/repo/friend/friend.service";
import { Ensure } from "../common/errors/Ensure.handler";

export class FriendController {
  constructor() {
    this.sendRequest = this.sendRequest.bind(this);
    this.acceptRequest = this.acceptRequest.bind(this);
    this.getFriends = this.getFriends.bind(this);
    this.removeFriendship = this.removeFriendship.bind(this);
  }

  async sendRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      await validator(sendFriendRequestSchema, req.body);
      const dto = req.body as SendFriendRequestDto;

      const friendService = new FriendService();
      const result = await friendService.sendRequest(userId, dto.friend_user_id);

      return res.status(HttpStatusCode.CREATED).json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("friend request", "created", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async acceptRequest(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      await validator(acceptFriendRequestSchema, req.body);
      const dto = req.body as AcceptFriendRequestDto;

      const friendService = new FriendService();
      const result = await friendService.acceptRequest(userId, dto.user_id);

      return res.json(
        ApiResponse.success(
          result,
          ErrorMessages.generateErrorMessage("friend request", "updated", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }

  async getFriends(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      const dto = (await validator(getFriendsQuerySchema, req.query)) as GetFriendsQueryDto;

      const friendService = new FriendService();
      const { data, total, page, limit } = await friendService.getFriends(userId, dto);

      return res.json(
        ApiResponse.success(data, ErrorMessages.generateErrorMessage("friends", "retrieved", lang), {
          count: total,
          page,
          limit,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  async removeFriendship(req: Request, res: Response, next: NextFunction) {
    try {
      const lang = (req.headers["accept-language"] as Language) || "en";
      const userId = (req as any).currentUser;
      Ensure.exists(userId, "user");

      await validator(removeFriendshipSchema, req.body);
      const dto = req.body as RemoveFriendshipDto;

      const friendService = new FriendService();
      await friendService.removeFriendship(userId, dto.friend_user_id);

      return res.json(
        ApiResponse.success(
          {},
          ErrorMessages.generateErrorMessage("friendship", "deleted", lang)
        )
      );
    } catch (err) {
      next(err);
    }
  }
}
