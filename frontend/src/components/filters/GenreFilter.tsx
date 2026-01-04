import { useQuery } from "@tanstack/react-query";
import { gamesAPI } from "@/lib/api";
import { ScrollFade } from "@/components/ui";

interface GenreFilterProps {
  selectedGenres: string[];
  onGenresChange: (genres: string[]) => void;
}

interface GenreStat {
  name: string;
  count: number;
}

export function GenreFilter({ selectedGenres, onGenresChange }: GenreFilterProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["genreStats"],
    queryFn: async () => {
      const response = await gamesAPI.getGenreStats();
      return response.data as { genres: GenreStat[] };
    },
  });

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
    <ScrollFade axis="y" className="space-y-1 max-h-48 overflow-y-auto">
      {genres.map((genre) => {
        const isSelected = selectedGenres.includes(genre.name);
        return (
          <button
            key={genre.name}
            onClick={() => toggleGenre(genre.name)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between border ${
              isSelected
                ? "bg-ctp-peach/20 text-ctp-peach border-ctp-peach"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-transparent"
            }`}
          >
            <span>{genre.name}</span>
            <span className="text-xs text-ctp-subtext1">{genre.count}</span>
          </button>
        );
      })}
    </ScrollFade>
  );
}
