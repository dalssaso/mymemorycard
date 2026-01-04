import { type InputHTMLAttributes, forwardRef } from "react";

export type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={`h-4 w-4 appearance-none rounded border border-ctp-surface2 bg-ctp-mantle text-ctp-mauve transition-colors focus:outline-none focus:ring-2 focus:ring-ctp-mauve focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 checked:border-ctp-mauve checked:bg-ctp-mauve relative checked:after:content-[''] checked:after:absolute checked:after:left-[5px] checked:after:top-[2px] checked:after:h-[8px] checked:after:w-[4px] checked:after:rotate-45 checked:after:border-b-2 checked:after:border-r-2 checked:after:border-white ${className}`}
        {...props}
      />
    );
  }
);

Checkbox.displayName = "Checkbox";
