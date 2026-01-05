import { createFileRoute, redirect, lazyRouteComponent } from "@tanstack/react-router";
import { statsAPI } from "@/lib/api";

const Activity = lazyRouteComponent(() =>
  import("@/pages/Activity").then((module) => ({ default: module.Activity }))
);

export interface ActivitySearchParams {
  page?: number;
}

const PAGE_SIZE = 20;

export const Route = createFileRoute("/activity")({
  beforeLoad: ({ context }) => {
    if (!context.auth.token) {
      throw redirect({ to: "/login" });
    }
  },
  validateSearch: (search: Record<string, unknown>): ActivitySearchParams => {
    const pageParam = search.page;
    const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : Number(pageParam);

    return {
      page: Number.isFinite(page) && page > 0 ? page : undefined,
    };
  },
  component: Activity,
  loader: async ({ context, location }) => {
    const search = location.search as ActivitySearchParams;
    const page = search.page ?? 1;

    await context.queryClient.ensureQueryData({
      queryKey: ["activityFeed", { page, pageSize: PAGE_SIZE }],
      queryFn: async () => {
        const response = await statsAPI.getActivityFeed({ page, pageSize: PAGE_SIZE });
        return response.data;
      },
    });
  },
});
