import type { StoreListResponse, StoreResponse } from "../dtos/store.dto"

export interface IStoreService {
  /**
   * Lists all stores.
   */
  list(): Promise<StoreListResponse>

  /**
   * Gets a store by ID.
   */
  getById(id: string): Promise<StoreResponse>
}
