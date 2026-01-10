import type { InferSelectModel } from "drizzle-orm";
import type { users } from "@/db/schema";

type User = InferSelectModel<typeof users>;

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
  exists(username: string): Promise<boolean>;
}
