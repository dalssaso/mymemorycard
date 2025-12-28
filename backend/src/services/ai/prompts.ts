export const SYSTEM_PROMPTS = {
  curator: `You are an expert video game curator with deep knowledge of gaming history, genres, and player preferences.
Provide personalized, insightful recommendations based on play history, completion status, and user preferences.
Be concise and focus on actionable suggestions. Always respond in valid JSON format.`,

  organizer: `You are a game library organizer specializing in identifying patterns and themes across game collections.
Suggest cohesive, themed collections that make sense for a player's library. Focus on meaningful connections
between games (series, genres, gameplay style, themes, developers). Always respond in valid JSON format.`,

  imageGenerator: `Create a thematic cover image for a video game collection. The image should be visually appealing,
represent the theme of the collection, and be suitable for use as a collection cover.`,
}

export interface GameSummary {
  id: string
  name: string
  genres: string[]
  status: string
  rating?: number | null
  playtimeHours?: number | null
  completionPercentage?: number | null
  seriesName?: string | null
  releaseYear?: number | null
}

export interface CollectionSuggestion {
  name: string
  description: string
  gameNames: string[]
  reasoning: string
}

export interface NextGameSuggestion {
  gameName: string
  reasoning: string
  estimatedHours?: number | null
}

export function buildCollectionSuggestionsPrompt(library: GameSummary[]): string {
  const libraryText = library
    .slice(0, 100)
    .map(
      (g) =>
        `${g.name} (${g.genres.join(', ')}) - ${g.status}${g.rating ? ` [${g.rating}/10]` : ''}${
          g.seriesName ? ` [Series: ${g.seriesName}]` : ''
        }`
    )
    .join('\n')

  return `Based on this game library, suggest 3-5 themed collections that would be meaningful for this player.

Library (${library.length} games total, showing first 100):
${libraryText}

Return JSON with this exact structure:
{
  "collections": [
    {
      "name": "Collection Name",
      "description": "Brief description of the theme (1-2 sentences)",
      "gameNames": ["Exact Game Title 1", "Exact Game Title 2"],
      "reasoning": "Why these games work together as a collection"
    }
  ]
}

Guidelines:
- Focus on: game series, genres, gameplay styles, completion status, themes, developers
- Collection names should be creative and descriptive
- Each collection should have 3-15 games
- Use exact game titles from the library
- Avoid generic collections (e.g., "All RPGs") - be more specific
- Consider the player's preferences based on ratings and playtime`
}

export function buildNextGameSuggestionPrompt(
  library: GameSummary[],
  userInput?: string | null
): string {
  const recentlyPlayed = library
    .filter((g) => g.playtimeHours && g.playtimeHours > 0)
    .slice(0, 10)
    .map(
      (g) =>
        `${g.name} (${g.genres.join(', ')}) - ${g.status}${g.rating ? ` [${g.rating}/10]` : ''} - ${
          g.playtimeHours
        }h played`
    )
    .join('\n')

  const backlog = library
    .filter((g) => g.status === 'backlog')
    .slice(0, 50)
    .map((g) => `${g.name} (${g.genres.join(', ')})${g.seriesName ? ` [Series: ${g.seriesName}]` : ''}`)
    .join('\n')

  const playing = library
    .filter((g) => g.status === 'playing')
    .map((g) => `${g.name} (${g.genres.join(', ')}) - ${g.completionPercentage || 0}% complete`)
    .join('\n')

  const userContext = userInput ? `\n\nUser's specific request: ${userInput}` : ''

  return `Suggest the next game this player should play from their library.

Recently Played (${recentlyPlayed.length > 0 ? 'with playtime' : 'none'}):
${recentlyPlayed.length > 0 ? recentlyPlayed : 'No recent playtime data'}

Currently Playing (${playing.length > 0 ? playing.length : 'none'}):
${playing.length > 0 ? playing : 'No games currently in progress'}

Backlog (${backlog.length} games, showing up to 50):
${backlog.length > 0 ? backlog : 'No games in backlog'}${userContext}

Return JSON with this exact structure:
{
  "gameName": "Exact Game Title",
  "reasoning": "Why this game is recommended next (consider: play history, genres enjoyed, completion patterns, variety, ${userInput ? 'user request, ' : ''}unfinished series)",
  "estimatedHours": 15
}

Guidelines:
- Recommend from backlog or currently playing games
- Consider play patterns, favorite genres (based on ratings/playtime), and variety
- If user specified a preference, prioritize that
- Provide thoughtful reasoning
- Use exact game title from library
- Estimated hours should be realistic (can be null if unknown)`
}

export function buildCoverImagePrompt(collectionName: string, collectionDescription: string): string {
  return `Create a cover image for a video game collection titled "${collectionName}".

Description: ${collectionDescription}

The image should:
- Visually represent the theme of this game collection
- Be suitable as a collection cover (landscape orientation, 16:9 ratio preferred)
- Have a cohesive color scheme that fits the theme
- Be visually appealing and professional
- Not include text (the collection name will be overlaid separately)`
}
