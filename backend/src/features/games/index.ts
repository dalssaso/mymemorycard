// Controllers
export { GamesController } from "./controllers/games.controller";
export type { IGamesController, GamesEnv } from "./controllers/games.controller.interface";

// Services
export { GameMetadataService } from "./services/game-metadata.service";
export type { IGameMetadataService } from "./services/game-metadata.service.interface";

// Repositories
export { GameRepository } from "./repositories/game.repository";
export type { IGameRepository } from "./repositories/game.repository.interface";
export { UserGameRepository } from "./repositories/user-game.repository";
export type { IUserGameRepository } from "./repositories/user-game.repository.interface";
export { PlatformRepository } from "./repositories/platform.repository";
export type { IPlatformRepository } from "./repositories/platform.repository.interface";
export { StoreRepository } from "./repositories/store.repository";
export type { IStoreRepository } from "./repositories/store.repository.interface";

// Types
export type {
  Game,
  UserGame,
  UserGameWithRelations,
  GameWithRelations,
  Platform,
  Store,
} from "./types";

// DTOs
export {
  GAME_SEARCH_REQUEST_SCHEMA,
  GAME_SEARCH_RESULTS_RESPONSE_SCHEMA,
  GAME_IMPORT_REQUEST_SCHEMA,
  GAME_UPDATE_REQUEST_SCHEMA,
  GAME_RESPONSE_SCHEMA,
  GAME_ID_PARAMS_SCHEMA,
  GAME_SEARCH_RESULT_SCHEMA,
  GAME_DETAILS_SCHEMA,
} from "./dtos/game.dto";
export type {
  GameSearchRequestDto,
  GameImportRequestDto,
  GameUpdateRequestDto,
  GameIdParamsDto,
  GameSearchResultDto,
  GameDetailsDto,
  GameResponseDto,
  GameListResponseDto,
  GameSearchResultsResponseDto,
} from "./dtos/game.dto";

export {
  USER_GAME_CREATE_REQUEST_SCHEMA,
  USER_GAME_RESPONSE_SCHEMA,
  USER_GAME_LIST_RESPONSE_SCHEMA,
  USER_GAME_UPDATE_REQUEST_SCHEMA,
  USER_GAME_ID_PARAMS_SCHEMA,
} from "./dtos/user-game.dto";
export type {
  UserGameCreateRequestDto,
  UserGameUpdateRequestDto,
  UserGameIdParamsDto,
  UserGameResponseDto,
  UserGameListResponseDto,
} from "./dtos/user-game.dto";
