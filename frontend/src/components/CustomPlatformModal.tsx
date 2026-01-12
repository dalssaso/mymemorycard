import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  ScrollFade,
} from "@/components/ui";
import { PlatformIconBadge } from "./PlatformIcon";
import { PlatformTypeIcon } from "./PlatformTypeIcon";

interface CustomPlatformModalProps {
  isOpen: boolean;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (data: {
    displayName: string;
    platformType: string;
    websiteUrl?: string;
    defaultIconUrl?: string;
    colorPrimary?: string;
  }) => void;
}

const PLATFORM_TYPES: Array<{ value: "pc" | "console" | "mobile" | "physical"; label: string }> = [
  { value: "pc", label: "PC" },
  { value: "console", label: "Console" },
  { value: "mobile", label: "Mobile" },
  { value: "physical", label: "Physical" },
];

export function CustomPlatformModal({
  isOpen,
  isSubmitting = false,
  onClose,
  onSubmit,
}: CustomPlatformModalProps) {
  const [displayName, setDisplayName] = useState("");
  const [platformType, setPlatformType] = useState<"pc" | "console" | "mobile" | "physical" | "">(
    ""
  );
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [defaultIconUrl, setDefaultIconUrl] = useState("");
  const [colorPrimary, setColorPrimary] = useState("#6B7280");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setDisplayName("");
      setPlatformType("");
      setWebsiteUrl("");
      setDefaultIconUrl("");
      setColorPrimary("#6B7280");
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }

    if (!platformType) {
      setError("Platform type is required");
      return;
    }

    // Validate SVG URL if provided
    if (defaultIconUrl.trim()) {
      const url = defaultIconUrl.trim().toLowerCase();
      if (!url.endsWith(".svg") && !url.startsWith("data:image/svg+xml")) {
        setError("Icon URL must be an SVG file (ending in .svg or data URI)");
        return;
      }
    }

    onSubmit({
      displayName: displayName.trim(),
      platformType,
      websiteUrl: websiteUrl.trim() || undefined,
      defaultIconUrl: defaultIconUrl.trim() || undefined,
      colorPrimary: colorPrimary || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-surface bg-base max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-text-primary text-xl font-semibold">
            Add Custom Platform
          </DialogTitle>
          <DialogDescription>
            Create a custom platform for stores or systems not in the default list.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-status-dropped/20 border-status-dropped text-status-dropped rounded border px-3 py-2">
            {error}
          </div>
        )}

        <ScrollFade axis="y" className="max-h-[60vh] space-y-4 overflow-y-auto">
          {/* Display Name */}
          <div>
            <label
              className="text-text-secondary mb-1 block text-xs font-medium"
              htmlFor="custom-platform-name"
            >
              Display Name <span className="text-status-dropped">*</span>
            </label>
            <Input
              id="custom-platform-name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Example: Nintendo Switch"
            />
          </div>

          {/* Platform Type */}
          <div>
            <p className="text-text-secondary mb-1 block text-xs font-medium">
              Platform Type <span className="text-status-dropped">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  type="button"
                  onClick={() => setPlatformType(type.value)}
                  className={`flex h-auto items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                    platformType === type.value
                      ? "bg-accent/10 hover:bg-accent/20 border-accent text-accent"
                      : "border-elevated text-text-secondary hover:border-elevated"
                  }`}
                >
                  <PlatformTypeIcon type={type.value} size="sm" />
                  <span>{type.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label
              className="text-text-secondary mb-1 block text-xs font-medium"
              htmlFor="custom-platform-website"
            >
              Website URL
            </label>
            <Input
              id="custom-platform-website"
              value={websiteUrl}
              onChange={(event) => setWebsiteUrl(event.target.value)}
              type="url"
              placeholder="https://example.com"
            />
          </div>

          {/* Icon URL */}
          <div>
            <label
              className="text-text-secondary mb-1 block text-xs font-medium"
              htmlFor="custom-platform-icon"
            >
              Icon URL (SVG only)
            </label>
            <Input
              id="custom-platform-icon"
              value={defaultIconUrl}
              onChange={(event) => setDefaultIconUrl(event.target.value)}
              type="url"
              placeholder="https://cdn.simpleicons.org/steam/ffffff"
            />
            <p className="text-text-muted mt-1 text-xs">
              Provide an SVG icon URL from{" "}
              <a
                href="https://simpleicons.org"
                target="_blank"
                rel="noreferrer"
                className="text-accent hover:text-accent"
              >
                Simple Icons
              </a>{" "}
              or leave empty for text badge.
            </p>
          </div>

          {/* Color */}
          <div>
            <label
              className="text-text-secondary mb-1 block text-xs font-medium"
              htmlFor="custom-platform-color"
            >
              Brand Color
            </label>
            <div className="flex gap-2">
              <Input
                id="custom-platform-color"
                value={colorPrimary}
                onChange={(event) => setColorPrimary(event.target.value)}
                className="flex-1"
                type="text"
                placeholder="#6B7280"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
              <Input
                value={colorPrimary}
                onChange={(event) => setColorPrimary(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded p-0"
                type="color"
                aria-label="Pick brand color"
              />
            </div>
            <p className="text-text-muted mt-1 text-xs">
              Use the platform&apos;s official brand color for consistency.
            </p>
          </div>

          {/* Live Preview */}
          {displayName && (
            <div className="bg-surface/50 border-elevated rounded-lg border p-4">
              <p className="text-text-secondary mb-2 block text-xs font-medium">Preview</p>
              <div className="flex items-center justify-center py-4">
                <PlatformIconBadge
                  platform={{
                    displayName: displayName || "Platform",
                    iconUrl: defaultIconUrl.trim() || null,
                    colorPrimary: colorPrimary || "#6B7280",
                  }}
                  size="lg"
                  showLabel={true}
                />
              </div>
            </div>
          )}
        </ScrollFade>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Platform"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
