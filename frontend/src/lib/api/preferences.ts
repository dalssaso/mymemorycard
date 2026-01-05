import { api } from "./axios";

export const preferencesAPI = {
  get: () => api.get("/preferences"),
  update: (prefs: {
    default_view?: "grid" | "table";
    items_per_page?: number;
    theme?: string;
    sidebar_collapsed?: boolean;
  }) => api.put("/preferences", prefs),
};
