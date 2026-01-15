import { z } from "zod";

/**
 * Schema for adding a platform to user account
 */
export const AddUserPlatformRequestSchema = z
  .object({
    platform_id: z.string().uuid("Invalid platform ID"),
    username: z.string().min(1, "Username cannot be empty").optional(),
    icon_url: z.string().url("Invalid icon URL").optional(),
    profile_url: z.string().url("Invalid profile URL").optional(),
    notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  })
  .strict()
  .openapi("AddUserPlatformRequest", {
    description: "Request to add a platform to user account",
    example: {
      platform_id: "123e4567-e89b-12d3-a456-426614174000",
      username: "my_username",
      icon_url: "https://example.com/icon.png",
      profile_url: "https://example.com/profile",
      notes: "My primary gaming platform",
    },
  });

export type AddUserPlatformRequest = z.infer<typeof AddUserPlatformRequestSchema>;

/**
 * Schema for updating a user-platform association
 */
export const UpdateUserPlatformRequestSchema = z
  .object({
    username: z.string().min(1, "Username cannot be empty").optional(),
    icon_url: z.string().url("Invalid icon URL").optional(),
    profile_url: z.string().url("Invalid profile URL").optional(),
    notes: z.string().max(500, "Notes must be 500 characters or less").optional(),
  })
  .strict()
  .openapi("UpdateUserPlatformRequest", {
    description: "Request to update a user-platform association",
    example: {
      username: "updated_username",
      notes: "Updated notes",
    },
  });

export type UpdateUserPlatformRequest = z.infer<typeof UpdateUserPlatformRequestSchema>;

/**
 * Schema for user-platform response
 */
export const UserPlatformResponseSchema = z
  .object({
    id: z.string().uuid(),
    user_id: z.string().uuid(),
    platform_id: z.string().uuid(),
    username: z.string().nullable().optional(),
    icon_url: z.string().url().nullable().optional(),
    profile_url: z.string().url().nullable().optional(),
    notes: z.string().nullable().optional(),
    created_at: z.string().datetime(),
  })
  .openapi("UserPlatformResponse", {
    description: "User-platform association response",
    example: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      user_id: "user-uuid",
      platform_id: "platform-uuid",
      username: "my_username",
      icon_url: "https://example.com/icon.png",
      profile_url: "https://example.com/profile",
      notes: "My primary gaming platform",
      created_at: "2026-01-14T10:00:00Z",
    },
  });

export type UserPlatformResponse = z.infer<typeof UserPlatformResponseSchema>;

/**
 * Schema for list response
 */
export const UserPlatformsListResponseSchema = z
  .object({
    user_platforms: z.array(UserPlatformResponseSchema),
  })
  .openapi("UserPlatformsListResponse", {
    description: "List of user platforms",
  });

export type UserPlatformsListResponse = z.infer<typeof UserPlatformsListResponseSchema>;

/**
 * UUID parameter schema
 */
export const UserPlatformIdParamsSchema = z.object({
  id: z.string().uuid("Invalid user-platform ID"),
});

export type UserPlatformIdParams = z.infer<typeof UserPlatformIdParamsSchema>;
