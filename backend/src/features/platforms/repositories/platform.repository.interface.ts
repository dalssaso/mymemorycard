import type { Platform } from "@/features/platforms/types";

export interface IPlatformRepository {
  list(): Promise<Platform[]>;
  getById(id: string): Promise<Platform | null>;
}
