import { useEffect, useState } from "react";
import { Button } from "@/components/ui";

const SHOW_AT_Y = 240;

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > SHOW_AT_Y);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <Button
      aria-label="Back to the top"
      variant="ghost"
      size="icon"
      className="border-ctp-mauve/40 fixed bottom-20 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border bg-ctp-mauve text-ctp-base shadow-lg transition-colors hover:bg-ctp-teal md:hidden"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <span className="material-symbols-outlined text-2xl leading-none">arrow_upward</span>
    </Button>
  );
}
