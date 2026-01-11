import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui";

interface SortControlProps {
  currentSort: string;
  onSortChange: (sort: string) => void;
}

const SORT_OPTIONS = [
  { value: "default", label: "Default (A-Z)" },
  { value: "playtime_desc", label: "Most Played" },
  { value: "playtime_asc", label: "Least Played" },
  { value: "completion_high", label: "Completion % (High to Low)" },
  { value: "completion_low", label: "Completion % (Low to High)" },
  { value: "achievement_high", label: "Most Achievements" },
  { value: "achievement_low", label: "Least Achievements" },
  { value: "rating_high", label: "Rating (High to Low)" },
  { value: "rating_low", label: "Rating (Low to High)" },
  { value: "last_played_recent", label: "Last Played (Recent)" },
  { value: "last_played_oldest", label: "Last Played (Oldest)" },
];

export function SortControl({ currentSort, onSortChange }: SortControlProps): JSX.Element {
  const value = currentSort || "default";

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort-select" className="text-ctp-subtext0 whitespace-nowrap text-sm">
        Sort by:
      </label>
      <Select
        value={value}
        onValueChange={(nextValue) => onSortChange(nextValue === "default" ? "" : nextValue)}
      >
        <SelectTrigger id="sort-select" className="w-[240px] text-sm">
          <SelectValue placeholder="Default (A-Z)" />
        </SelectTrigger>
        <SelectContent>
          {SORT_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
