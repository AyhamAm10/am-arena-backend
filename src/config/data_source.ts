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


dotenv.config();
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, NODE_ENV } =
  process.env;

console.log(DB_PASSWORD);
export const AppDataSource = new DataSource({
  type: "postgres",
  host: DB_HOST,
  port: Number(DB_PORT || "9523"),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false,
  logging: false,
  schema: "public",
  ssl: false,
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
  ],

  migrations: [__dirname + "/../migrations/*.{js,ts}"],
  subscribers: [],
});
