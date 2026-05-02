export class LevelSystemService {
  /** Formula: requiredXp for a single level (xp needed to go from level to level+1) */
  static getXpRequiredForLevel(level: number): number {
    const l = Math.max(1, Math.floor(level));
    return Math.floor(100 * Math.pow(l, 1.35));
  }

  /** Total XP required to reach the start of `level` (level 1 => 0) */
  static getTotalXpRequiredForLevel(level: number): number {
    const l = Math.max(1, Math.floor(level));
    if (l <= 1) return 0;
    let total = 0;
    for (let i = 1; i < l; i++) {
      total += LevelSystemService.getXpRequiredForLevel(i);
    }
    return total;
  }

  /** Determine current level from total XP. Level ranges start at 1. */
  static getLevelFromXp(xp: number): number {
    const totalXp = Math.max(0, Math.floor(xp || 0));
    let level = 1;
    // increment until the total xp required for next level is greater than xp
    while (true) {
      const nextTotal = LevelSystemService.getTotalXpRequiredForLevel(level + 1);
      if (totalXp >= nextTotal) {
        level += 1;
        // safety cap to avoid infinite loops on pathological input
        if (level > 10000) break;
        continue;
      }
      break;
    }
    return level;
  }

  /** Progress info towards the next level */
  static getProgressToNextLevel(xp: number) {
    const totalXp = Math.max(0, Math.floor(xp || 0));
    const currentLevel = LevelSystemService.getLevelFromXp(totalXp);
    const currentLevelTotal = LevelSystemService.getTotalXpRequiredForLevel(currentLevel);
    const nextLevel = currentLevel + 1;
    const nextLevelXp = LevelSystemService.getXpRequiredForLevel(nextLevel);
    const currentLevelXp = totalXp - currentLevelTotal;
    const progressPercent = nextLevelXp > 0 ? Math.floor((currentLevelXp / nextLevelXp) * 100) : 0;
    return {
      currentLevel,
      currentLevelXp,
      nextLevelXp,
      progressPercent,
    };
  }
}

export default LevelSystemService;
