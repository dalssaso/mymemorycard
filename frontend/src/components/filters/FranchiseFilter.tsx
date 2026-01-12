import { Button, ScrollFade } from "@/components/ui";
import { useFranchises } from "@/hooks/useFranchises";

interface FranchiseFilterProps {
  selectedFranchises: string[];
  onFranchisesChange: (seriesNames: string[]) => void;
}

export function FranchiseFilter({ selectedFranchises, onFranchisesChange }: FranchiseFilterProps) {
  const { data, isLoading, error } = useFranchises();

  const franchises = data?.franchises || [];

  const toggleFranchise = (seriesName: string) => {
    if (selectedFranchises.includes(seriesName)) {
      onFranchisesChange(selectedFranchises.filter((f) => f !== seriesName));
    } else {
      onFranchisesChange([...selectedFranchises, seriesName]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading franchises...</div>;
  }

  if (error) {
    console.error("Franchises error:", error);
    return <div className="text-sm text-status-dropped">Error loading franchises</div>;
  }

  if (franchises.length === 0) {
    return <div className="text-sm text-text-muted">No franchises found</div>;
  }

  return (
    <ScrollFade axis="y" className="max-h-48 space-y-1 overflow-y-auto">
      {franchises.map((franchise) => {
        const isSelected = selectedFranchises.includes(franchise.series_name);
        return (
          <Button
            key={franchise.series_name}
            onClick={() => toggleFranchise(franchise.series_name)}
            variant="ghost"
            className={`flex h-auto w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              isSelected
                ? "bg-accent/20 border-accent text-accent"
                : "border-transparent text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <span className="truncate">{franchise.series_name}</span>
            <span className="flex-shrink-0 text-xs text-text-muted">{franchise.game_count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
