import { createFileRoute, lazyRouteComponent } from "@tanstack/react-router";
import { franchisesAPI } from "@/lib/api";

const Franchises = lazyRouteComponent(() =>
  import("@/pages/Franchises").then((module) => ({ default: module.Franchises }))
);

export const Route = createFileRoute("/franchises/")({
  component: Franchises,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["franchises"],
      queryFn: async () => {
        const response = await franchisesAPI.getAll();
        return response.data;
      },
    });
  },
});
