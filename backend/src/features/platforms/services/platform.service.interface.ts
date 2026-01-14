import type { PlatformListResponse, PlatformResponse } from "../dtos/platform.dto";

export interface IPlatformService {
  list(): Promise<PlatformListResponse>;
  getById(id: string): Promise<PlatformResponse>;
}
