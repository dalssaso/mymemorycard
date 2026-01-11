import { useState, useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui";

interface FilterSectionProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  defaultOpen?: boolean;
  storageKey?: string;
  children: ReactNode;
  onClear?: () => void;
  hasSelection?: boolean;
}

export function FilterSection({
  title,
  icon,
  iconColor,
  defaultOpen = true,
  storageKey,
  children,
  onClear,
  hasSelection = false,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`library-sidebar-${storageKey}`);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultOpen;
  });

  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`library-sidebar-${storageKey}`, String(isOpen));
    }
  }, [isOpen, storageKey]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          className="text-ctp-subtext0 hover:text-ctp-text flex h-auto cursor-pointer items-center gap-2 p-0 text-xs font-semibold uppercase tracking-wider transition-colors"
          aria-expanded={isOpen}
        >
          <svg
            className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className={iconColor}>{icon}</span>
          {title}
        </Button>
        {onClear && hasSelection && (
          <Button
            onClick={onClear}
            variant="ghost"
            className="text-ctp-subtext1 hover:text-ctp-text h-auto px-2 py-0.5 text-xs transition-colors"
          >
            Clear
          </Button>
        )}
      </div>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}
