import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui";

interface BackButtonProps {
  label?: string;
  iconOnly?: boolean;
  className?: string;
}

export function BackButton({ label = "Back", iconOnly = false, className = "" }: BackButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    navigate({ to: "/dashboard" as const });
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      aria-label={label}
      variant="ghost"
      size={iconOnly ? "icon" : "sm"}
      className={className}
    >
      <svg
        className={iconOnly ? "w-5 h-5" : "w-4 h-4"}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
        />
      </svg>
      {!iconOnly && <span>{label}</span>}
    </Button>
  );
}
