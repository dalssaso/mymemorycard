export interface Platform {
  id: string;
  igdbPlatformId: number | null;
  name: string;
  abbreviation: string | null;
  slug: string | null;
  platformFamily: string | null;
  colorPrimary: string;
  createdAt: Date | null;
}
