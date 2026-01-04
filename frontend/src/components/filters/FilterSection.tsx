import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui";

interface FilterSectionProps {
  title: string;
  icon: ReactNode;
  iconColor: string;
  defaultOpen?: boolean;
  children: ReactNode;
  onClear?: () => void;
  hasSelection?: boolean;
}

export function FilterSection({
  title,
  icon,
  iconColor,
  defaultOpen = true,
  children,
  onClear,
  hasSelection = false,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-3">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="ghost"
          className="h-auto p-0 flex items-center gap-2 text-xs font-semibold text-ctp-subtext0 uppercase tracking-wider cursor-pointer hover:text-ctp-text transition-colors"
          aria-expanded={isOpen}
        >
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-90" : ""}`}
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
            className="h-auto px-2 py-0.5 text-xs text-ctp-subtext1 hover:text-ctp-text transition-colors"
          >
            Clear
          </Button>
        )}
      </div>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}
