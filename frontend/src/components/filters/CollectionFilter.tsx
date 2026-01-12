import { Button, ScrollFade } from "@/components/ui";

interface Collection {
  id: string;
  name: string;
  game_count: number;
}

interface CollectionFilterProps {
  selectedCollections: string[];
  onCollectionsChange: (collectionIds: string[]) => void;
  collections: Collection[];
}

export function CollectionFilter({
  selectedCollections,
  onCollectionsChange,
  collections,
}: CollectionFilterProps) {
  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      onCollectionsChange(selectedCollections.filter((c) => c !== collectionId));
    } else {
      onCollectionsChange([...selectedCollections, collectionId]);
    }
  };

  if (collections.length === 0) {
    return <div className="text-ctp-subtext1 text-sm">No collections yet</div>;
  }

  return (
    <ScrollFade axis="y" className="max-h-48 space-y-1 overflow-y-auto">
      {collections.map((collection) => {
        const isSelected = selectedCollections.includes(collection.id);
        return (
          <Button
            key={collection.id}
            onClick={() => toggleCollection(collection.id)}
            variant="ghost"
            className={`flex h-auto w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-all ${
              isSelected
                ? "bg-ctp-mauve/20 border-ctp-mauve text-ctp-mauve"
                : "text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-transparent"
            }`}
          >
            <span className="truncate">{collection.name}</span>
            <span className="text-ctp-subtext1 flex-shrink-0 text-xs">{collection.game_count}</span>
          </Button>
        );
      })}
    </ScrollFade>
  );
}
