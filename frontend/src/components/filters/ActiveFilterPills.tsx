import type { LibraryFilters } from "@/hooks/useLibraryFilters";
import { Button } from "@/components/ui";

interface ActiveFilterPillsProps {
  filters: LibraryFilters;
  setFilter: <K extends keyof LibraryFilters>(key: K, value: LibraryFilters[K]) => void;
  onClearAll: () => void;
}

interface FilterPill {
  key: keyof LibraryFilters;
  label: string;
  value: string;
  itemValue?: string;
  colorClass?: string;
}

const STATUS_LABELS: Record<string, string> = {
  backlog: "Backlog",
  playing: "Playing",
  finished: "Finished",
  completed: "Completed",
  dropped: "Dropped",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-ctp-subtext1/20 border-ctp-subtext1/40 text-ctp-subtext1",
  playing: "bg-ctp-teal/20 border-ctp-teal/40 text-ctp-teal",
  finished: "bg-ctp-green/20 border-ctp-green/40 text-ctp-green",
  completed: "bg-ctp-yellow/20 border-ctp-yellow/40 text-ctp-yellow",
  dropped: "bg-ctp-red/20 border-ctp-red/40 text-ctp-red",
};

export function ActiveFilterPills({ filters, setFilter, onClearAll }: ActiveFilterPillsProps) {
  const pills: FilterPill[] = [];

  if (filters.platform) {
    pills.push({
      key: "platform",
      label: "Platform",
      value: filters.platform,
      colorClass: "bg-ctp-mauve/20 border-ctp-mauve/40 text-ctp-mauve",
    });
  }

  if (filters.status) {
    pills.push({
      key: "status",
      label: "Status",
      value: STATUS_LABELS[filters.status] || filters.status,
      colorClass:
        STATUS_COLORS[filters.status] || "bg-ctp-mauve/20 border-ctp-mauve/40 text-ctp-mauve",
    });
  }

  if (filters.favorites) {
    pills.push({
      key: "favorites",
      label: "Favorites",
      value: "Only",
      colorClass: "bg-ctp-red/20 border-ctp-red/40 text-ctp-red",
    });
  }

  filters.genre.forEach((genre) => {
    pills.push({
      key: "genre",
      label: "Genre",
      value: genre,
      itemValue: genre,
      colorClass: "bg-ctp-peach/20 border-ctp-peach/40 text-ctp-peach",
    });
  });

  filters.collection.forEach((collection) => {
    pills.push({
      key: "collection",
      label: "Collection",
      value: collection,
      itemValue: collection,
      colorClass: "bg-ctp-sapphire/20 border-ctp-sapphire/40 text-ctp-sapphire",
    });
  });

  filters.franchise.forEach((franchise) => {
    pills.push({
      key: "franchise",
      label: "Franchise",
      value: franchise,
      itemValue: franchise,
      colorClass: "bg-ctp-lavender/20 border-ctp-lavender/40 text-ctp-lavender",
    });
  });

  if (pills.length === 0) {
    return null;
  }

  const handleRemove = (pill: FilterPill) => {
    if (pill.key === "favorites") {
      setFilter("favorites", false);
      return;
    }

    if (pill.key === "genre" || pill.key === "collection" || pill.key === "franchise") {
      const currentArray = filters[pill.key];
      const newArray = currentArray.filter((item) => item !== pill.itemValue);
      setFilter(pill.key, newArray);
      return;
    }

    if (pill.key === "platform" || pill.key === "status" || pill.key === "sort") {
      setFilter(pill.key, "");
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium text-ctp-subtext0">Active filters:</span>
      {pills.map((pill, index) => (
        <div
          key={`${pill.key}-${pill.itemValue || pill.value}-${index}`}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${pill.colorClass}`}
        >
          <span className="max-w-[200px] truncate">
            {pill.label}: {pill.value}
          </span>
          <Button
            onClick={() => handleRemove(pill)}
            variant="ghost"
            size="icon"
            className="h-auto w-auto flex-shrink-0 transition-opacity hover:opacity-70"
            aria-label={`Remove ${pill.label} filter`}
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      ))}
      {pills.length > 1 && (
        <Button
          onClick={onClearAll}
          variant="link"
          className="h-auto p-0 text-xs text-ctp-subtext0 underline transition-colors hover:text-ctp-text"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
