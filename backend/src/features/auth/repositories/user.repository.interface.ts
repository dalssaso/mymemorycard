import type { User } from "../types";

export type { User };

export interface IUserRepository {
  findByUsername(username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(username: string, email: string, passwordHash: string): Promise<User>;
  exists(username: string): Promise<boolean>;
}
