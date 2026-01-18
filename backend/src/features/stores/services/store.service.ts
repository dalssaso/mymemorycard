import { injectable, inject } from "tsyringe";
import { Logger } from "@/infrastructure/logging/logger";
import { NotFoundError } from "@/shared/errors/base";
import { STORE_REPOSITORY_TOKEN } from "@/container/tokens";
import type { IStoreRepository } from "@/features/games/repositories/store.repository.interface";
import type { IStoreService } from "./store.service.interface";
import type { Store } from "@/features/games/types";
import type { StoreDto, StoreListResponse, StoreResponse } from "../dtos/store.dto";

@injectable()
export class StoreService implements IStoreService {
  private logger: Logger;

  constructor(
    @inject(STORE_REPOSITORY_TOKEN) private repo: IStoreRepository,
    @inject(Logger) logger: Logger
  ) {
    this.logger = logger.child("StoreService");
  }

  /**
   * Lists all stores.
   */
  async list(): Promise<StoreListResponse> {
    this.logger.debug("Listing all stores");
    const stores = await this.repo.list();
    return { stores: stores.map((s) => this.toDto(s)) };
  }

  /**
   * Gets a store by ID.
   */
  async getById(id: string): Promise<StoreResponse> {
    this.logger.debug("Getting store by ID", { id });
    const store = await this.repo.findById(id);

    if (!store) {
      throw new NotFoundError("Store", id);
    }

    return { store: this.toDto(store) };
  }

  private toDto(store: Store): StoreDto {
    return {
      id: store.id,
      slug: store.slug,
      display_name: store.display_name,
      store_type: store.store_type,
      platform_family: store.platform_family,
      color_primary: store.color_primary,
      website_url: store.website_url,
      icon_url: store.icon_url,
      supports_achievements: store.supports_achievements,
      supports_library_sync: store.supports_library_sync,
      igdb_website_category: store.igdb_website_category,
      sort_order: store.sort_order,
      created_at: store.created_at?.toISOString() ?? null,
    };
  }
}
