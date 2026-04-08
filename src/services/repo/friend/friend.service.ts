import { Ensure } from "../../../common/errors/Ensure.handler";
import { Friend, FriendStatus } from "../../../entities/Friend";
import { RepoService } from "../../repo.service";
import { GetFriendsQueryDto } from "../../../dto/friend/get-friends-query.dto";
import { NotificationService } from "../notification/notification.service";

export class FriendService extends RepoService<Friend> {
  constructor() {
    super(Friend);
    this.sendRequest = this.sendRequest.bind(this);
    this.acceptRequest = this.acceptRequest.bind(this);
    this.getFriends = this.getFriends.bind(this);
    this.removeFriendship = this.removeFriendship.bind(this);
    this.removePendingFriendship = this.removePendingFriendship.bind(this);
  }

  async sendRequest(userId: number, friendUserId: number) {
    Ensure.custom(userId !== friendUserId, "Cannot send friend request to yourself");

    const existingA = await this.findOneByCondition({
      user_id: userId,
      friend_user_id: friendUserId,
    } as any);
    const existingB = await this.findOneByCondition({
      user_id: friendUserId,
      friend_user_id: userId,
    } as any);
    Ensure.custom(!existingA && !existingB, "Friend request already exists or already friends");

    const row = await this.create({
      user_id: userId,
      friend_user_id: friendUserId,
      status: FriendStatus.PENDING,
    } as any);

    const notificationService = new NotificationService();
    await notificationService.notifyFriendRequest({
      receiverUserId: friendUserId,
      fromUserId: userId,
    });

    return row;
  }

  async acceptRequest(currentUserId: number, requesterId: number) {
    const record = await this.findOneByCondition({
      user_id: requesterId,
      friend_user_id: currentUserId,
      status: FriendStatus.PENDING,
    } as any);
    Ensure.exists(record, "friend request");

    const entity = this.repo.merge(record!, { status: FriendStatus.ACCEPTED });
    return await this.repo.save(entity);
  }

  async getFriends(userId: number, query: GetFriendsQueryDto) {
    const { status, direction, gamer_name, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const qb = this.repo
      .createQueryBuilder("friend")
      .leftJoinAndSelect("friend.user", "user")
      .leftJoinAndSelect("friend.friend", "friendUser")
      .where("(friend.user_id = :userId OR friend.friend_user_id = :userId)", { userId });

    if (status) {
      qb.andWhere("friend.status = :status", { status });
    }
    if (String(status) === FriendStatus.PENDING && direction === "incoming") {
      qb.andWhere("friend.friend_user_id = :userId", { userId });
    }
    if (String(status) === FriendStatus.PENDING && direction === "outgoing") {
      qb.andWhere("friend.user_id = :userId", { userId });
    }
    if (gamer_name && gamer_name.trim()) {
      qb.andWhere(
        "(user.gamer_name ILIKE :search OR friendUser.gamer_name ILIKE :search)",
        { search: `%${gamer_name.trim()}%` }
      );
    }

    const [data, total] = await qb
      .orderBy("friend.created_at", "DESC")
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async removeFriendship(currentUserId: number, friendUserId: number) {
    const recordA = await this.findOneByCondition({
      user_id: currentUserId,
      friend_user_id: friendUserId,
      status: FriendStatus.ACCEPTED,
    } as any);
    const recordB = await this.findOneByCondition({
      user_id: friendUserId,
      friend_user_id: currentUserId,
      status: FriendStatus.ACCEPTED,
    } as any);

    const record = recordA || recordB;
    Ensure.exists(record, "friendship");

    await this.repo.delete({
      user_id: (record as any).user_id,
      friend_user_id: (record as any).friend_user_id,
    });
  }

  /** Deletes a pending row whether current user sent or received the request. */
  async removePendingFriendship(currentUserId: number, otherUserId: number) {
    const recordA = await this.findOneByCondition({
      user_id: currentUserId,
      friend_user_id: otherUserId,
      status: FriendStatus.PENDING,
    } as any);
    const recordB = await this.findOneByCondition({
      user_id: otherUserId,
      friend_user_id: currentUserId,
      status: FriendStatus.PENDING,
    } as any);

    const record = recordA || recordB;
    Ensure.exists(record, "friend request");

    await this.repo.delete({
      user_id: (record as any).user_id,
      friend_user_id: (record as any).friend_user_id,
    });
  }
}
