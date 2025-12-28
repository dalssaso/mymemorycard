import { ScrollFade } from '@/components/ui'

interface Collection {
  id: string
  name: string
  game_count: number
}

interface CollectionFilterProps {
  selectedCollections: string[]
  onCollectionsChange: (collectionIds: string[]) => void
  collections: Collection[]
}

export function CollectionFilter({
  selectedCollections,
  onCollectionsChange,
  collections,
}: CollectionFilterProps) {
  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      onCollectionsChange(selectedCollections.filter((c) => c !== collectionId))
    } else {
      onCollectionsChange([...selectedCollections, collectionId])
    }
  }

  if (collections.length === 0) {
    return <div className="text-sm text-ctp-subtext1">No collections yet</div>
  }

  return (
    <ScrollFade axis="y" className="space-y-1 max-h-48 overflow-y-auto">
      {collections.map((collection) => {
        const isSelected = selectedCollections.includes(collection.id)
        return (
          <button
            key={collection.id}
            onClick={() => toggleCollection(collection.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between gap-2 border ${
              isSelected
                ? 'bg-ctp-mauve/20 text-ctp-mauve border-ctp-mauve'
                : 'text-ctp-subtext0 hover:bg-ctp-surface0 hover:text-ctp-text border-transparent'
            }`}
          >
            <span className="truncate">{collection.name}</span>
            <span className="text-xs text-ctp-subtext1 flex-shrink-0">{collection.game_count}</span>
          </button>
        )
      })}
    </ScrollFade>
  )
}
