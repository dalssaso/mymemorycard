import type { Store as SdkStore, StoreListResponse as SdkStoreListResponse } from "../generated";
import type { Store, StoresListResponse } from "../services";

/**
 * Adapts SDK Store to frontend Store type.
 * Maps display_name to both name and display_name for backwards compatibility.
 *
 * @param sdk - SDK Store from generated API client
 * @returns Frontend Store with simplified structure
 */
export function adaptStore(sdk: SdkStore): Store {
  return {
    id: sdk.id,
    name: sdk.display_name,
    slug: sdk.slug,
    display_name: sdk.display_name,
    platform_family: sdk.platform_family,
    icon_url: sdk.icon_url,
  };
}

/**
 * Adapts SDK store list response to frontend format.
 *
 * @param sdk - SDK StoreListResponse from generated API client
 * @returns Frontend StoresListResponse
 */
export function adaptStoreListResponse(sdk: SdkStoreListResponse): StoresListResponse {
  return {
    stores: sdk.stores.map(adaptStore),
  };
}
