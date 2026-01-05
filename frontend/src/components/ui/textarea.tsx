import * as React from "react";

import { cn } from "@/lib/cn";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref): JSX.Element => {
    return (
      <textarea
        className={cn(
          "flex min-h-[60px] w-full rounded-md border border-ctp-surface1 bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-ctp-overlay1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ctp-mauve disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
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
