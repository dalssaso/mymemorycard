import { type ReactNode, useEffect, useRef, type HTMLAttributes } from "react";

type ScrollFadeAxis = "x" | "y";

interface ScrollFadeProps extends HTMLAttributes<HTMLDivElement> {
  axis?: ScrollFadeAxis;
  children: ReactNode;
}

export function ScrollFade({ axis = "y", className = "", children, ...props }: ScrollFadeProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    let frameId = 0;
    const fadeSize = 24;

    const applyFadeState = () => {
      frameId = 0;
      const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } =
        element;

      const hasVerticalOverflow = scrollHeight - clientHeight > 1;
      const hasHorizontalOverflow = scrollWidth - clientWidth > 1;

      if (axis === "y") {
        const topFade = hasVerticalOverflow && scrollTop > 1 ? fadeSize : 0;
        const bottomFade =
          hasVerticalOverflow && scrollTop + clientHeight < scrollHeight - 1 ? fadeSize : 0;

        element.style.setProperty("--scroll-fade-top", `${topFade}px`);
        element.style.setProperty("--scroll-fade-bottom", `${bottomFade}px`);
      } else {
        const leftFade = hasHorizontalOverflow && scrollLeft > 1 ? fadeSize : 0;
        const rightFade =
          hasHorizontalOverflow && scrollLeft + clientWidth < scrollWidth - 1 ? fadeSize : 0;

        element.style.setProperty("--scroll-fade-left", `${leftFade}px`);
        element.style.setProperty("--scroll-fade-right", `${rightFade}px`);
      }
    };

    const scheduleUpdate = () => {
      if (frameId) {
        return;
      }
      frameId = requestAnimationFrame(applyFadeState);
    };

    applyFadeState();
    element.addEventListener("scroll", scheduleUpdate, { passive: true });

    const resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(element);

    if (element.firstElementChild instanceof HTMLElement) {
      resizeObserver.observe(element.firstElementChild);
    }

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
      element.removeEventListener("scroll", scheduleUpdate);
      resizeObserver.disconnect();
    };
  }, [axis]);

  const axisClass = axis === "y" ? "scroll-fade-y" : "scroll-fade-x";

  return (
    <div
      ref={containerRef}
      className={`scroll-container scrollbar-custom ${axisClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
