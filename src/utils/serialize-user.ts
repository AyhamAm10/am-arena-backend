import { User } from "../entities/User";
import { Achievement } from "../entities/Achievement";
import { mediaResponseUrl } from "./media-url";

type UserLike = Partial<User> & {
  id: number;
  full_name?: string;
  gamer_name?: string;
  email?: string;
  phone?: string | null;
  country?: string | null;
  role?: string;
  is_active?: boolean;
  coins?: number | string;
  xp_points?: number | string;
  profile_picture_url?: string | null;
  avatar_public_id?: string | null;
  created_at?: Date | string;
  selected_achievement?: Achievement | null;
};

function serializeSelectedAchievement(
  achievement: Achievement | null | undefined
) {
  if (!achievement) return null;
  return {
    id: achievement.id,
    name: achievement.name,
    description: achievement.description,
    color_theme: achievement.color_theme,
    icon_url: mediaResponseUrl(achievement.icon_url),
    icon_public_id: achievement.icon_public_id ?? null,
    xp_reward: achievement.xp_reward,
    type: achievement.type,
    logic_type: achievement.logic_type,
    target: achievement.target ?? null,
  };
}

export function serializeAvatarFields(user: Pick<UserLike, "profile_picture_url" | "avatar_public_id">) {
  return {
    avatarUrl: mediaResponseUrl(user.profile_picture_url ?? "") || null,
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

/** Safe public profile — never password_hash, tokens, or push tokens. */
export function serializeUserPublic(user: UserLike) {
  const created =
    user.created_at instanceof Date
      ? user.created_at.toISOString()
      : user.created_at
        ? String(user.created_at)
        : undefined;

  return {
    id: user.id,
    full_name: user.full_name ?? "",
    gamer_name: user.gamer_name ?? "",
    email: user.email ?? "",
    phone: user.phone ?? null,
    country: user.country ?? null,
    role: user.role ?? "user",
    is_active: user.is_active ?? true,
    coins: Number(user.coins ?? 0),
    xp_points: Number(user.xp_points ?? 0),
    ...serializeAvatarFields(user),
    selected_achievement: serializeSelectedAchievement(
      user.selected_achievement ?? null
    ),
    ...(created ? { created_at: created } : {}),
  };
}

/** Same as serializeUserPublic — kept for existing imports. */
export function serializeUserAccount(user: UserLike) {
  return serializeUserPublic(user);
}
