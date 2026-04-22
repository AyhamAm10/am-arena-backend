import { PubgGame } from "../entities/PubgGame";
import { mediaResponseUrl } from "./media-url";

export function mapPubgGameForResponse(game: PubgGame | null): PubgGame | null {
  if (!game) return null;
  return {
    ...game,
    image: mediaResponseUrl(game.image),
  };
}
