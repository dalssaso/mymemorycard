import { createFileRoute } from "@tanstack/react-router";
import { SeriesDetail } from "@/pages/SeriesDetail";

export const Route = createFileRoute("/collections/series/$seriesName")({
  component: SeriesDetail,
});
