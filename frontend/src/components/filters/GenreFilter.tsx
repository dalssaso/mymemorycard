import { Button, ScrollFade } from "@/components/ui";
import { useGenreStats } from "@/hooks/useGenreStats";

interface GenreFilterProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

export function GenreFilter({ selectedGenres, onGenresChange }: GenreFilterProps) {
  const { data, isLoading } = useGenreStats();

  const genres = data?.genres || [];

  const toggleGenre = (genreName: string) => {
    if (selectedGenres.includes(genreName)) {
      onGenresChange(selectedGenres.filter((g) => g !== genreName));
    } else {
      onGenresChange([...selectedGenres, genreName]);
    }
  };

  if (isLoading) {
    return <div className="text-sm text-text-muted">Loading genres...</div>;
  }

  if (genres.length === 0) {
    return <div className="text-sm text-text-muted">No genres found</div>;
  }

  return (
    <ScrollFade axis="y" className="max-h-48 space-y-1 overflow-y-auto">
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.name);
        return (
          <Button
            key={genre.name}
            onClick={() => toggleGenre(genre.name)}
            variant="ghost"
            className={`flex h-auto w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all duration-standard ${
              isSelected
                ? "bg-accent/20 border-accent text-accent"
                : "border-transparent text-text-secondary hover:bg-surface hover:text-text-primary"
            }`}
          >
            <span>{genre.name}</span>
            <span className="text-xs text-text-muted">{genre.count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
