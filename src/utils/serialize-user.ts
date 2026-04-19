import { User } from "../entities/User";

type UserLike = Partial<User> & {
  id: number;
  full_name?: string;
  gamer_name?: string;
  profile_picture_url?: string | null;
  avatar_public_id?: string | null;
};

export function serializeAvatarFields(user: Pick<UserLike, "profile_picture_url" | "avatar_public_id">) {
  return {
    avatarUrl: user.profile_picture_url ?? null,
    avatarPublicId: user.avatar_public_id ?? null,
  };
}

export function serializeUserRef(user: UserLike) {
  return {
    id: user.id,
    gamer_name: user.gamer_name ?? "",
    full_name: user.full_name ?? "",
    ...serializeAvatarFields(user),
  };
}

export function serializeUserAccount(user: UserLike) {
  return {
    ...user,
    ...serializeAvatarFields(user),
  };
}
