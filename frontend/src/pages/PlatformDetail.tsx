import { useEffect, useState } from "react";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { PlatformDetailSidebar } from "@/components/sidebar";
import { BackButton, PageLayout } from "@/components/layout";
import { Button, Input, Textarea } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { PlatformIconBadge } from "@/components/PlatformIcon";
import { PlatformTypeIcon } from "@/components/PlatformTypeIcon";
import { userPlatformsAPI } from "@/lib/api";

interface UserPlatformDetail {
  id: string;
  platform_id: string;
  username: string | null;
  icon_url: string | null;
  profile_url: string | null;
  notes: string | null;
  created_at: string;
  name: string;
  display_name: string;
  platform_type: "pc" | "console" | "mobile" | "physical";
  color_primary: string;
  default_icon_url: string | null;
}

const profileSchema = z.object({
  username: z.string().trim().max(60).optional().or(z.literal("")),
  profileUrl: z.string().trim().url().optional().or(z.literal("")),
  iconUrl: z.string().trim().url().optional().or(z.literal("")),
});

const notesSchema = z.object({
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NotesFormValues = z.infer<typeof notesSchema>;

export function PlatformDetail() {
  const { id } = useParams({ from: "/platforms/$id" });
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["user-platform", id],
    queryFn: async () => {
      const response = await userPlatformsAPI.getOne(id);
      return response.data as { platform: UserPlatformDetail };
    },
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      profileUrl: "",
      iconUrl: "",
    },
  });

  const notesForm = useForm<NotesFormValues>({
    resolver: zodResolver(notesSchema),
    defaultValues: {
      notes: "",
    },
  });

  const updatePlatformMutation = useMutation({
    mutationFn: (payload: {
      username?: string | null;
      iconUrl?: string | null;
      profileUrl?: string | null;
      notes?: string | null;
    }) => userPlatformsAPI.update(id, payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ["user-platform", id] });
      await queryClient.cancelQueries({ queryKey: ["user-platforms"] });

      const previousPlatform = queryClient.getQueryData<{ platform: UserPlatformDetail }>([
        "user-platform",
        id,
      ]);
      const previousPlatforms = queryClient.getQueryData<{ platforms: UserPlatformDetail[] }>([
        "user-platforms",
      ]);

      if (previousPlatform) {
        queryClient.setQueryData(["user-platform", id], {
          platform: {
            ...previousPlatform.platform,
            username: payload.username ?? previousPlatform.platform.username,
            icon_url: payload.iconUrl ?? previousPlatform.platform.icon_url,
            profile_url: payload.profileUrl ?? previousPlatform.platform.profile_url,
            notes: payload.notes ?? previousPlatform.platform.notes,
          },
        });
      }

      if (previousPlatforms?.platforms) {
        queryClient.setQueryData(["user-platforms"], {
          platforms: previousPlatforms.platforms.map((platform) =>
            platform.id === id
              ? {
                  ...platform,
                  username: payload.username ?? platform.username,
                  icon_url: payload.iconUrl ?? platform.icon_url,
                  profile_url: payload.profileUrl ?? platform.profile_url,
                  notes: payload.notes ?? platform.notes,
                }
              : platform
          ),
        });
      }

      return { previousPlatform, previousPlatforms };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-platform", id] });
      queryClient.invalidateQueries({ queryKey: ["user-platforms"] });
      showToast("Platform updated", "success");
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlatform) {
        queryClient.setQueryData(["user-platform", id], context.previousPlatform);
      }
      if (context?.previousPlatforms) {
        queryClient.setQueryData(["user-platforms"], context.previousPlatforms);
      }
      showToast("Failed to update platform", "error");
    },
  });

  const deletePlatformMutation = useMutation({
    mutationFn: () => userPlatformsAPI.remove(id),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["user-platforms"] });
      const previousPlatforms = queryClient.getQueryData<{ platforms: UserPlatformDetail[] }>([
        "user-platforms",
      ]);

      if (previousPlatforms?.platforms) {
        queryClient.setQueryData(["user-platforms"], {
          platforms: previousPlatforms.platforms.filter((platform) => platform.id !== id),
        });
      }

      return { previousPlatforms };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-platforms"] });
      showToast("Platform removed", "success");
      navigate({ to: "/platforms" });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlatforms) {
        queryClient.setQueryData(["user-platforms"], context.previousPlatforms);
      }
      showToast("Failed to remove platform", "error");
    },
  });

  const platform = data?.platform;

  useEffect(() => {
    if (!platform) {
      return;
    }
    profileForm.reset({
      username: platform.username ?? "",
      profileUrl: platform.profile_url ?? "",
      iconUrl: platform.icon_url ?? "",
    });
    notesForm.reset({
      notes: platform.notes ?? "",
    });
  }, [platform, profileForm, notesForm]);

  const sidebarContent = platform ? (
    <PlatformDetailSidebar
      platformName={platform.display_name}
      platformType={platform.platform_type}
      username={platform.username}
    />
  ) : null;

  if (isLoading || !platform) {
    return (
      <PageLayout sidebar={sidebarContent} customCollapsed={true}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-text-secondary">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  const handleSaveProfile = profileForm.handleSubmit((values) => {
    updatePlatformMutation.mutate({
      username: values.username?.trim() || null,
      profileUrl: values.profileUrl?.trim() || null,
      iconUrl: values.iconUrl?.trim() || null,
    });
    setIsEditingProfile(false);
  });

  const handleSaveNotes = notesForm.handleSubmit((values) => {
    updatePlatformMutation.mutate({
      notes: values.notes?.trim() || null,
    });
    setIsEditingNotes(false);
  });

  return (
    <PageLayout sidebar={sidebarContent} showBackButton={false} customCollapsed={true}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <BackButton
              iconOnly={true}
              className="text-text-secondary hover:bg-surface hover:text-text-primary rounded-lg p-2 transition-all md:hidden"
            />
            <PlatformIconBadge
              platform={{
                displayName: platform.display_name,
                iconUrl: platform.icon_url || platform.default_icon_url,
                colorPrimary: platform.color_primary,
              }}
              size="lg"
            />
            <div>
              <h1 className="text-text-primary text-4xl font-bold">{platform.display_name}</h1>
              <div className="mt-1">
                <PlatformTypeIcon
                  type={platform.platform_type}
                  size="sm"
                  showLabel={true}
                  color={platform.color_primary}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" asChild>
              <Link to="/platforms">Back to Platforms</Link>
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (confirm(`Remove ${platform.display_name}?`)) {
                  deletePlatformMutation.mutate();
                }
              }}
              disabled={deletePlatformMutation.isPending}
            >
              Remove Platform
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div id="profile" className="bg-surface/30 rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-accent text-xl font-semibold">Profile</h2>
                {!isEditingProfile && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      profileForm.reset({
                        username: platform.username ?? "",
                        profileUrl: platform.profile_url ?? "",
                        iconUrl: platform.icon_url ?? "",
                      });
                      setIsEditingProfile(true);
                    }}
                    className="text-accent hover:text-accent h-auto px-0 text-sm hover:bg-transparent"
                  >
                    Edit
                  </Button>
                )}
              </div>

              {isEditingProfile ? (
                <form className="space-y-3" onSubmit={handleSaveProfile}>
                  <div>
                    <label
                      className="text-text-secondary mb-1 block text-xs font-medium"
                      htmlFor="platform-username"
                    >
                      Username
                    </label>
                    <Input
                      id="platform-username"
                      {...profileForm.register("username")}
                      placeholder="Optional username"
                    />
                    {profileForm.formState.errors.username && (
                      <p className="text-status-dropped mt-1 text-xs">
                        {profileForm.formState.errors.username.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="text-text-secondary mb-1 block text-xs font-medium"
                      htmlFor="platform-profile-url"
                    >
                      Profile URL
                    </label>
                    <Input
                      id="platform-profile-url"
                      {...profileForm.register("profileUrl")}
                      placeholder="Optional profile link"
                    />
                    {profileForm.formState.errors.profileUrl && (
                      <p className="text-status-dropped mt-1 text-xs">
                        {profileForm.formState.errors.profileUrl.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      className="text-text-secondary mb-1 block text-xs font-medium"
                      htmlFor="platform-icon-url"
                    >
                      Icon URL (SVG only - overrides default)
                    </label>
                    <Input
                      id="platform-icon-url"
                      {...profileForm.register("iconUrl")}
                      placeholder={
                        platform.default_icon_url || "https://cdn.simpleicons.org/steam/ffffff"
                      }
                    />
                    {profileForm.formState.errors.iconUrl && (
                      <p className="text-status-dropped mt-1 text-xs">
                        {profileForm.formState.errors.iconUrl.message}
                      </p>
                    )}
                    <p className="text-text-muted mt-1 text-xs">
                      Provide an SVG icon URL from{" "}
                      <a
                        href={`https://simpleicons.org/?q=${encodeURIComponent(
                          platform.display_name
                        )}`}
                        className="text-accent hover:text-accent"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Simple Icons
                      </a>{" "}
                      or leave empty to use{" "}
                      {platform.default_icon_url ? "platform default" : "text badge"}.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={updatePlatformMutation.isPending}>
                      {updatePlatformMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        profileForm.reset({
                          username: platform.username ?? "",
                          profileUrl: platform.profile_url ?? "",
                          iconUrl: platform.icon_url ?? "",
                        });
                        setIsEditingProfile(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-text-muted space-y-2">
                  <div>
                    <div>
                      <span className="text-text-muted">Username:</span>{" "}
                      {platform.username || "Not set"}
                    </div>
                  </div>
                  <div>
                    <span className="text-text-muted">Profile URL:</span>{" "}
                    {platform.profile_url || "Not set"}
                  </div>
                  <div>
                    <span className="text-text-muted">Icon URL:</span>{" "}
                    {platform.icon_url || "Not set"}
                  </div>
                  {!platform.icon_url && (
                    <div className="text-text-muted text-xs">
                      Add a direct image URL for a square platform icon. Official press kits and
                      Simple Icons are good sources.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div id="notes" className="bg-surface/30 rounded-lg p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-accent text-xl font-semibold">Notes</h2>
                {!isEditingNotes && (
                  <Button
                    variant="ghost"
                    onClick={() => {
                      notesForm.reset({
                        notes: platform.notes ?? "",
                      });
                      setIsEditingNotes(true);
                    }}
                    className="text-accent hover:text-accent h-auto px-0 text-sm hover:bg-transparent"
                  >
                    {platform.notes ? "Edit" : "Add Notes"}
                  </Button>
                )}
              </div>

              {isEditingNotes ? (
                <form onSubmit={handleSaveNotes}>
                  <Textarea
                    {...notesForm.register("notes")}
                    className="bg-elevated text-text-primary focus-visible:ring-accent min-h-24"
                    placeholder="Add notes about this platform"
                  />
                  {notesForm.formState.errors.notes && (
                    <p className="text-status-dropped mt-1 text-xs">
                      {notesForm.formState.errors.notes.message}
                    </p>
                  )}
                  <div className="mt-2 flex gap-2">
                    <Button type="submit" disabled={updatePlatformMutation.isPending}>
                      {updatePlatformMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => {
                        notesForm.reset({
                          notes: platform.notes ?? "",
                        });
                        setIsEditingNotes(false);
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="bg-elevated/50 text-text-muted rounded-lg p-4">
                  {platform.notes || "No notes yet"}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-text-secondary mb-1 text-xs">Platform Type</div>
              <PlatformTypeIcon
                type={platform.platform_type}
                size="md"
                showLabel={true}
                color={platform.color_primary}
              />
            </div>
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-text-secondary mb-1 text-xs">Brand Color</div>
              <div className="flex items-center gap-2">
                <div
                  className="border-border h-6 w-6 rounded border"
                  style={{ backgroundColor: platform.color_primary }}
                />
                <span className="text-text-primary font-mono text-sm">{platform.color_primary}</span>
              </div>
            </div>
            {platform.default_icon_url && (
              <div className="bg-surface/50 rounded-lg p-4">
                <div className="text-text-secondary mb-1 text-xs">Default Icon</div>
                <div className="text-text-muted break-all text-xs">
                  {platform.default_icon_url.substring(0, 50)}...
                </div>
              </div>
            )}
            <div className="bg-surface/50 rounded-lg p-4">
              <div className="text-text-secondary mb-1 text-xs">Saved Since</div>
              <div className="text-text-primary text-sm">
                {new Date(platform.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
