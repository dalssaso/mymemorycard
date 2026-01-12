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
    return <div className="text-text-muted text-sm">Loading genres...</div>;
  }

  if (genres.length === 0) {
    return <div className="text-text-muted text-sm">No genres found</div>;
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
            className={`flex h-auto w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              isSelected
                ? "bg-accent/20 border-accent text-accent"
                : "text-text-secondary hover:bg-surface hover:text-text-primary border-transparent"
            }`}
          >
            <span>{genre.name}</span>
            <span className="text-text-muted text-xs">{genre.count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
