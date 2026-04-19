import { AppDataSource } from "../../../config/data_source";
import { Highlight } from "../../../entities/Highlight";
import { Achievement, AchievementType } from "../../../entities/Achievement";
import { PubgRegistration } from "../../../entities/PubgRegistration";
import { Vote } from "../../../entities/Vote";

type AggregatedUserStats = {
  tournament_join: number;
  tournament_win: number;
  tournament_rank: number;
  poll_participation: number;
  poll_win: number;
  highlight: number;
};

export type AchievementProgressSnapshot = {
  current: number;
  target: number | null;
  percentage: number;
  is_obtained: boolean;
};

function toPercentage(current: number, target: number | null, isObtained: boolean): number {
  if (isObtained) return 100;
  if (target == null || target <= 0) return current > 0 ? 100 : 0;
  const bounded = Math.min(100, Math.max(0, Math.round((current / target) * 100)));
  return bounded;
}

export class AchievementProgressService {
  async aggregateUserStats(userId: number): Promise<AggregatedUserStats> {
    const registrationRepo = AppDataSource.getRepository(PubgRegistration);
    const winnerRows = await AppDataSource.query(
      `SELECT COUNT(*)::int AS count FROM tournament_winners WHERE user_id = $1`,
      [userId],
    );

    const [tournamentJoin, pollParticipation, highlightCount] = await Promise.all([
      registrationRepo.count({ where: { user: { id: userId } } as any }),
      AppDataSource.getRepository(Vote).count({ where: { user: { id: userId } } as any }),
      AppDataSource.getRepository(Highlight).count({ where: { user: { id: userId } } as any }),
    ]);

    const pollWinRows = await AppDataSource.query(
      `
        SELECT COUNT(DISTINCT winner_vote."pollId")::int AS count
        FROM votes winner_vote
        INNER JOIN poll_options winner_option ON winner_option.id = winner_vote."optionId"
        INNER JOIN polls poll ON poll.id = winner_vote."pollId"
        WHERE winner_vote."userId" = $1
          AND poll.is_active = false
          AND NOT EXISTS (
            SELECT 1
            FROM poll_options other_option
            LEFT JOIN votes other_vote ON other_vote."optionId" = other_option.id
            WHERE other_option."pollId" = poll.id
            GROUP BY other_option.id
            HAVING COUNT(other_vote.id) > (
              SELECT COUNT(*)
              FROM votes selected_vote
              WHERE selected_vote."optionId" = winner_option.id
            )
          )
      `,
      [userId],
    );

    const tournamentWin = Number(winnerRows?.[0]?.count ?? 0);
    const pollWin = Number(pollWinRows?.[0]?.count ?? 0);

    return {
      tournament_join: tournamentJoin,
      tournament_win: tournamentWin,
      tournament_rank: tournamentWin,
      poll_participation: pollParticipation,
      poll_win: pollWin,
      highlight: highlightCount,
    };
  }

  getProgress(
    achievement: Achievement,
    stats: AggregatedUserStats,
    isObtained: boolean,
  ): AchievementProgressSnapshot {
    const current = this.resolveCurrent(achievement.type, stats, isObtained);
    const target = achievement.logic_type === "progress" ? achievement.target ?? null : achievement.target ?? null;

    return {
      current,
      target,
      percentage: toPercentage(current, target, isObtained),
      is_obtained: isObtained,
    };
  }

  private resolveCurrent(
    type: AchievementType,
    stats: AggregatedUserStats,
    isObtained: boolean,
  ): number {
    switch (type) {
      case AchievementType.TOURNAMENT_JOIN:
        return stats.tournament_join;
      case AchievementType.TOURNAMENT_WIN:
        return stats.tournament_win;
      case AchievementType.TOURNAMENT_RANK:
        return stats.tournament_rank;
      case AchievementType.POLL_PARTICIPATION:
        return stats.poll_participation;
      case AchievementType.POLL_WIN:
        return stats.poll_win;
      case AchievementType.HIGHLIGHT:
        return stats.highlight;
      case AchievementType.CUSTOM:
      case AchievementType.EVENT_SPECIAL:
      default:
        return isObtained ? 1 : 0;
    }
  }
}
