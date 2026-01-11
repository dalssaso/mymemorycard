import * as React from "react";

import { cn } from "@/lib/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref): JSX.Element => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-base shadow-sm transition-colors duration-150 ease-out placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
