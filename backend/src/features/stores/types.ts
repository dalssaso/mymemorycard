export interface Store {
  id: string;
  slug: string;
  displayName: string;
  storeType: "digital" | "physical";
  platformFamily: string | null;
  colorPrimary: string;
  websiteUrl: string | null;
  iconUrl: string | null;
  supportsAchievements: boolean;
  supportsLibrarySync: boolean;
  igdbWebsiteCategory: number | null;
  sortOrder: number;
  createdAt: Date | null;
}
