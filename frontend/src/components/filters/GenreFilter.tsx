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
    return <div className="text-sm text-ctp-subtext1">Loading genres...</div>;
  }

  if (genres.length === 0) {
    return <div className="text-sm text-ctp-subtext1">No genres found</div>;
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
                ? "bg-ctp-peach/20 border-ctp-peach text-ctp-peach"
                : "border-transparent text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text"
            }`}
          >
            <span>{genre.name}</span>
            <span className="text-xs text-ctp-subtext1">{genre.count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
