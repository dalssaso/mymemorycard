import type { InferSelectModel } from "drizzle-orm";
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { users } from "@/db/schema";

/**
 * User entity type derived from database schema.
 * Uses camelCase properties (passwordHash, createdAt, updatedAt)
 * which map to snake_case database columns.
 */
export type User = InferSelectModel<typeof users>;
