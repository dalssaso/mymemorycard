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
    return <div className="text-sm text-ctp-subtext1">Loading franchises...</div>;
  }

  if (error) {
    console.error("Franchises error:", error);
    return <div className="text-sm text-ctp-red">Error loading franchises</div>;
  }

  if (franchises.length === 0) {
    return <div className="text-sm text-ctp-subtext1">No franchises found</div>;
  }

  return (
    <ScrollFade axis="y" className="space-y-1 max-h-48 overflow-y-auto">
      {franchises.map((franchise) => {
        const isSelected = selectedFranchises.includes(franchise.series_name);
        return (
          <Button
            key={franchise.series_name}
            onClick={() => toggleFranchise(franchise.series_name)}
            variant="ghost"
            className={`h-auto w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-2 border ${
              isSelected
                ? "bg-ctp-teal/20 text-ctp-teal border-ctp-teal"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-transparent"
            }`}
          >
            <span className="truncate">{franchise.series_name}</span>
            <span className="text-xs text-ctp-subtext1 flex-shrink-0">{franchise.game_count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
