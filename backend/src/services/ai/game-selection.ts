import type { GameSummary } from "@/services/ai/prompts";

export interface SelectionStrategy {
  playing: number; // % of limit
  highRated: number; // % of limit (rating >= 8)
  diverse: number; // % of limit (genre diversity)
  backlog: number; // % of limit
}

const DEFAULT_STRATEGY: SelectionStrategy = {
  playing: 0.2, // 20%
  highRated: 0.2, // 20%
  diverse: 0.4, // 40%
  backlog: 0.2, // 20%
};

export function smartSampleGames(
  library: GameSummary[],
  limit: number,
  strategy: SelectionStrategy = DEFAULT_STRATEGY
): GameSummary[] {
  const selected: GameSummary[] = [];
  const used = new Set<string>();

  // 1. Playing games (20%)
  const playing = library.filter((g) => g.status === "playing");
  const playingCount = Math.floor(limit * strategy.playing);
  for (let i = 0; i < Math.min(playingCount, playing.length); i++) {
    selected.push(playing[i]);
    used.add(playing[i].id);
  }

  // 2. High-rated games (20%)
  const highRated = library.filter((g) => !used.has(g.id) && (g.rating ?? 0) >= 8);
  const highRatedCount = Math.floor(limit * strategy.highRated);
  for (let i = 0; i < Math.min(highRatedCount, highRated.length); i++) {
    selected.push(highRated[i]);
    used.add(highRated[i].id);
  }

  // 3. Diverse genres (40%)
  const diverseCount = Math.floor(limit * strategy.diverse);
  const genreMap = new Map<string, GameSummary[]>();
  for (const game of library) {
    if (used.has(game.id)) continue;
    for (const genre of game.genres) {
      if (!genreMap.has(genre)) genreMap.set(genre, []);
      genreMap.get(genre)!.push(game);
    }
  }
  const genres = Array.from(genreMap.keys());
  let genreIndex = 0;
  for (let i = 0; i < diverseCount && genres.length > 0; i++) {
    const genre = genres[genreIndex % genres.length];
    const gamesInGenre = genreMap.get(genre)!.filter((g) => !used.has(g.id));
    if (gamesInGenre.length > 0) {
      selected.push(gamesInGenre[0]);
      used.add(gamesInGenre[0].id);
    }
    genreIndex++;
  }

  // 4. Backlog games (20%)
  const backlog = library.filter((g) => !used.has(g.id) && g.status === "backlog");
  const backlogCount = Math.floor(limit * strategy.backlog);
  for (let i = 0; i < Math.min(backlogCount, backlog.length); i++) {
    selected.push(backlog[i]);
    used.add(backlog[i].id);
  }

  // Fill remaining slots with any unused games
  const remaining = library.filter((g) => !used.has(g.id));
  for (let i = 0; i < remaining.length && selected.length < limit; i++) {
    selected.push(remaining[i]);
  }

  return selected.slice(0, limit);
}

export function weightGamesByPreferences(
  library: GameSummary[],
  _preferenceEmbeddings: Array<{ embedding: number[]; weight: number }>
): GameSummary[] {
  // TODO: Phase 3.2 - Calculate similarity scores and weight by preferences
  // For now, return library as-is (will be implemented after preference learning)
  return library;
}
