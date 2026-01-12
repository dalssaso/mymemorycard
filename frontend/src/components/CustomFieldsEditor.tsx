import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { gamesAPI } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import { PlaySessionTracker } from "@/components/PlaySessionTracker";
import { ProgressHistory } from "@/components/ProgressHistory";

interface CustomFieldsEditorProps {
  gameId: string;
  platformId: string;
}

interface CustomFields {
  completion_percentage?: number | null;
  difficulty_rating?: number | null;
}

export function CustomFieldsEditor({ gameId, platformId }: CustomFieldsEditorProps) {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [fields, setFields] = useState<CustomFields>({});

  const { data } = useQuery({
    queryKey: ["customFields", gameId, platformId],
    queryFn: async () => {
      const response = await gamesAPI.getCustomFields(gameId, platformId);
      return response.data as { customFields: CustomFields };
    },
  });

  useEffect(() => {
    if (data?.customFields) {
      setFields(data.customFields);
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (updatedFields: CustomFields) =>
      gamesAPI.updateCustomFields(gameId, platformId, updatedFields),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customFields", gameId, platformId] });
      showToast("Custom fields updated successfully", "success");
    },
    onError: () => {
      showToast("Failed to update custom fields", "error");
    },
  });

  const handleFieldChange = (field: keyof CustomFields, value: number | null) => {
    const updatedFields = { ...fields, [field]: value };
    setFields(updatedFields);
    updateMutation.mutate({ [field]: value });
  };

  return (
    <div className="space-y-8">
      <PlaySessionTracker gameId={gameId} platformId={platformId} />

      <div className="border-t border-elevated" />

      <ProgressHistory gameId={gameId} platformId={platformId} />

      <div className="border-t border-elevated" />

      <div>
        <span
          className="mb-2 block text-sm font-medium text-text-secondary"
          id="difficulty-rating-label"
        >
          Difficulty Rating (1-10)
        </span>
        <div className="flex gap-1" role="group" aria-labelledby="difficulty-rating-label">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
            <Button
              key={rating}
              onClick={() => handleFieldChange("difficulty_rating", rating)}
              aria-pressed={fields.difficulty_rating === rating}
              variant="ghost"
              className={cn(
                "h-auto flex-1 rounded py-2 text-sm transition-all duration-standard",
                fields.difficulty_rating === rating
                  ? "shadow-status-dropped/50 bg-status-dropped text-text-primary shadow-lg"
                  : "bg-surface text-text-secondary hover:bg-elevated hover:text-text-primary"
              )}
            >
              {rating}
            </Button>
          ))}
        </div>
        {fields.difficulty_rating && (
          <Button
            onClick={() => handleFieldChange("difficulty_rating", null)}
            variant="link"
            className="mt-2 h-auto p-0 text-sm text-text-muted hover:text-text-muted"
          >
            Clear rating
          </Button>
        )}
      </div>
    </div>
  );
}
