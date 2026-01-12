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
  backlog: "bg-text-muted/20 border-text-muted/40 text-text-muted",
  playing: "bg-accent/20 border-accent/40 text-accent",
  finished: "bg-status-finished/20 border-status-finished/40 text-status-finished",
  completed: "bg-accent/20 border-accent/40 text-accent",
  dropped: "bg-status-dropped/20 border-status-dropped/40 text-status-dropped",
};

export function ActiveFilterPills({ filters, setFilter, onClearAll }: ActiveFilterPillsProps) {
  const pills: FilterPill[] = [];

  if (filters.platform) {
    pills.push({
      key: "platform",
      label: "Platform",
      value: filters.platform,
      colorClass: "bg-accent/20 border-accent/40 text-accent",
    });
  }

  if (filters.status) {
    pills.push({
      key: "status",
      label: "Status",
      value: STATUS_LABELS[filters.status] || filters.status,
      colorClass: STATUS_COLORS[filters.status] || "bg-accent/20 border-accent/40 text-accent",
    });
  }

  if (filters.favorites) {
    pills.push({
      key: "favorites",
      label: "Favorites",
      value: "Only",
      colorClass: "bg-status-dropped/20 border-status-dropped/40 text-status-dropped",
    });
  }

  filters.genre.forEach((genre) => {
    pills.push({
      key: "genre",
      label: "Genre",
      value: genre,
      itemValue: genre,
      colorClass: "bg-accent/20 border-accent/40 text-accent",
    });
  });

  filters.collection.forEach((collection) => {
    pills.push({
      key: "collection",
      label: "Collection",
      value: collection,
      itemValue: collection,
      colorClass: "bg-accent/20 border-accent/40 text-accent",
    });
  });

  filters.franchise.forEach((franchise) => {
    pills.push({
      key: "franchise",
      label: "Franchise",
      value: franchise,
      itemValue: franchise,
      colorClass: "bg-accent/20 border-accent/40 text-accent",
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
      <span className="text-xs font-medium text-text-secondary">Active filters:</span>
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
          className="h-auto p-0 text-xs text-text-secondary underline transition-colors duration-standard hover:text-text-primary"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
