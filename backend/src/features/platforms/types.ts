import type { InferSelectModel } from "drizzle-orm"
import type { platforms } from "@/db/schema"

export type Platform = InferSelectModel<typeof platforms>
