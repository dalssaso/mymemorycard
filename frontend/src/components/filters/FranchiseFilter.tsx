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
    return <div className="text-ctp-subtext1 text-sm">Loading franchises...</div>;
  }

  if (error) {
    console.error("Franchises error:", error);
    return <div className="text-ctp-red text-sm">Error loading franchises</div>;
  }

  if (franchises.length === 0) {
    return <div className="text-ctp-subtext1 text-sm">No franchises found</div>;
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
                ? "bg-ctp-teal/20 border-ctp-teal text-ctp-teal"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-transparent"
            }`}
          >
            <span className="truncate">{franchise.series_name}</span>
            <span className="text-ctp-subtext1 flex-shrink-0 text-xs">{franchise.game_count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
