import type { Platform } from "../types";

export interface IPlatformRepository {
  list(): Promise<Platform[]>;
  getById(id: string): Promise<Platform | null>;
}
