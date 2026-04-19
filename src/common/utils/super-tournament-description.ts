const SUPER_TOURNAMENT_PREFIX = "[SUPER_TOURNAMENT]";

export function encodeSuperTournamentDescription(
  description: string,
  minXpRequired: number
) {
  return `${SUPER_TOURNAMENT_PREFIX}${minXpRequired}\n${description}`;
}

export function decodeSuperTournamentDescription(value: string) {
  if (!value.startsWith(SUPER_TOURNAMENT_PREFIX)) {
    return {
      description: value,
      min_xp_required: 0,
    };
  }

  const [header, ...descriptionLines] = value.split("\n");
  const minXp = Number(header.replace(SUPER_TOURNAMENT_PREFIX, "")) || 0;

  return {
    description: descriptionLines.join("\n"),
    min_xp_required: minXp,
  };
}
