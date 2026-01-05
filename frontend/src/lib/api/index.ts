export { api } from "./axios";
export { authAPI } from "./auth";
export { gamesAPI } from "./games";
export { importAPI } from "./import";
export { platformsAPI } from "./platforms";
export { userPlatformsAPI } from "./user-platforms";
export { preferencesAPI } from "./preferences";
export { sessionsAPI } from "./sessions";
export { completionLogsAPI } from "./completion-logs";
export type { CompletionType } from "./completion-logs";
export { additionsAPI } from "./additions";
export type { GameAddition, AdditionType } from "./additions";
export { ownershipAPI } from "./ownership";
export type { OwnershipData, EditionInfo, DlcInfo } from "./ownership";
export { displayEditionAPI } from "./display-edition";
export type { DisplayEditionData, RawgEditionOption, DisplayEditionInfo } from "./display-edition";
export { statsAPI } from "./stats";
export type {
  AchievementStats,
  CombinedHeatmapDay,
  CombinedHeatmapSummary,
  ActivityFeedResponse,
  ActivityFeedParams,
} from "./stats";
export { collectionsAPI } from "./collections";
export { franchisesAPI } from "./franchises";
export type { FranchiseSummary, OwnedGame, MissingGame, FranchiseDetail } from "./franchises";
export { aiAPI } from "./ai";
export type {
  AiProviderConfig,
  CollectionSuggestion,
  NextGameSuggestion,
  AiActivityLog,
  ModelCapability,
  ModelsResponse,
} from "./ai";
