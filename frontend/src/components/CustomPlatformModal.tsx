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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-ctp-mantle border-ctp-surface0">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-ctp-text">
            Add Custom Platform
          </DialogTitle>
          <DialogDescription>
            Create a custom platform for stores or systems not in the default list.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-ctp-red/20 border border-ctp-red text-ctp-red px-3 py-2 rounded">
            {error}
          </div>
        )}

        <ScrollFade axis="y" className="space-y-4 max-h-[60vh] overflow-y-auto">
          {/* Display Name */}
          <div>
            <label
              className="block text-xs font-medium mb-1 text-ctp-subtext0"
              htmlFor="custom-platform-name"
            >
              Display Name <span className="text-ctp-red">*</span>
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
            <p className="block text-xs font-medium mb-1 text-ctp-subtext0">
              Platform Type <span className="text-ctp-red">*</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PLATFORM_TYPES.map((type) => (
                <Button
                  key={type.value}
                  variant="outline"
                  type="button"
                  onClick={() => setPlatformType(type.value)}
                  className={`px-3 py-2 h-auto rounded-lg text-sm flex items-center gap-2 ${
                    platformType === type.value
                      ? "border-ctp-teal bg-ctp-teal/10 text-ctp-teal hover:bg-ctp-teal/20"
                      : "border-ctp-surface1 text-ctp-subtext0 hover:border-ctp-surface2"
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
              className="block text-xs font-medium mb-1 text-ctp-subtext0"
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
              className="block text-xs font-medium mb-1 text-ctp-subtext0"
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
            <p className="text-xs text-ctp-overlay1 mt-1">
              Provide an SVG icon URL from{" "}
              <a
                href="https://simpleicons.org"
                target="_blank"
                rel="noreferrer"
                className="text-ctp-teal hover:text-ctp-mauve"
              >
                Simple Icons
              </a>{" "}
              or leave empty for text badge.
            </p>
          </div>

          {/* Color */}
          <div>
            <label
              className="block text-xs font-medium mb-1 text-ctp-subtext0"
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
                className="w-12 h-10 rounded cursor-pointer p-0"
                type="color"
                aria-label="Pick brand color"
              />
            </div>
            <p className="text-xs text-ctp-overlay1 mt-1">
              Use the platform&apos;s official brand color for consistency.
            </p>
          </div>

          {/* Live Preview */}
          {displayName && (
            <div className="border border-ctp-surface1 rounded-lg p-4 bg-ctp-surface0/50">
              <p className="block text-xs font-medium mb-2 text-ctp-subtext0">Preview</p>
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
