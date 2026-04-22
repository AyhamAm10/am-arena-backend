import * as dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Achievement } from "../entities/Achievement";
import { Chat } from "../entities/Chat";
import { ChatMember } from "../entities/ChatMember";
import { Friend } from "../entities/Friend";
import { Highlight } from "../entities/Highlight";
import { HeroContent } from "../entities/HeroContent";
import { Message } from "../entities/Message";
import { PubgGame } from "../entities/PubgGame";
import { PubgRegistration } from "../entities/PubgRegistration";
import { PubgRegistrationField } from "../entities/PubgRegistrationField";
import { PubgRegistrationFieldValue } from "../entities/PubgRegistrationFieldValue";
import { Reel } from "../entities/Reel";
import { ReelComment } from "../entities/ReelComment";
import { ReelLike } from "../entities/ReelLike";
import { Tag } from "../entities/Tag";
import { Tournament } from "../entities/Tournament";
import { User } from "../entities/User";
import { UserAchievement } from "../entities/UserAchievement";
import { UserNotification } from "../entities/UserNotification";
import { Poll } from "../entities/Poll";
import { PollOption } from "../entities/PollOption";
import { Vote } from "../entities/Vote";
import { Wallet } from "../entities/wallet";
import { WalletTransaction } from "../entities/wallet_transaction";
import { Payment } from "../entities/payment";
import { Package } from "../entities/package";


dotenv.config();
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, NODE_ENV } =
  process.env;

function requiredEnv(name: string, value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    throw new Error(`${name} is required`);
  }
  return trimmed;
}

function shouldUseDbSsl() {
  const explicit = process.env.DB_SSL?.trim().toLowerCase();
  if (explicit === "1" || explicit === "true") return true;
  if (explicit === "0" || explicit === "false") return false;
  return NODE_ENV === "production";
}

export const AppDataSource = new DataSource({
  type: "postgres",
  host: requiredEnv("DB_HOST", DB_HOST),
  port: Number(requiredEnv("DB_PORT", DB_PORT)),
  username: requiredEnv("DB_USER", DB_USER),
  password: requiredEnv("DB_PASSWORD", DB_PASSWORD),
  database: requiredEnv("DB_NAME", DB_NAME),
  synchronize: false,
  logging: false,
  schema: "public",
  ssl: shouldUseDbSsl()
    ? {
        rejectUnauthorized:
          process.env.DB_SSL_REJECT_UNAUTHORIZED?.trim() !== "0",
      }
    : false,
  entities: [
    Achievement,
    Chat,
    ChatMember,
    Friend,
    Highlight,
    HeroContent,
    Message,
    PubgGame,
    PubgRegistration,
    PubgRegistrationField,
    PubgRegistrationFieldValue,
    Reel,
    ReelComment,
    ReelLike,
    Tag,
    Tournament,
    User,
    UserAchievement,
    UserNotification,
    Poll,
    PollOption,
    Vote,
    Wallet,
    WalletTransaction,
    Payment,
    Package,
  ],

  migrations: [__dirname + "/../migrations/*.{js,ts}"],
  subscribers: [],
});
