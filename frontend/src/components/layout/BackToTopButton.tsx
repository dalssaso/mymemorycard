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
      variant="default"
      size="icon"
      className="fixed bottom-20 right-4 z-40 h-11 w-11 rounded-full shadow-lg md:hidden"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      type="button"
    >
      <span className="material-symbols-outlined text-2xl leading-none">arrow_upward</span>
    </Button>
  );
}
