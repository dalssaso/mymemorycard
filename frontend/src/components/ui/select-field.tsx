import type { ReactNode } from "react";
import { Select, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check } from "lucide-react";

export interface SelectFieldOption {
  value: string;
  label: string;
  metadata?: ReactNode;
}

export interface SelectFieldProps {
  id?: string;
  value: string;
  options: SelectFieldOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  id,
  value,
  options,
  onChange,
  placeholder,
  className,
}: SelectFieldProps): JSX.Element {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectPrimitive.Item
            key={option.value}
            value={option.value}
            className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors duration-150 ease-smooth focus:bg-accent/20 focus:text-text-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
          >
            <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
              <SelectPrimitive.ItemIndicator>
                <Check className="h-4 w-4" />
              </SelectPrimitive.ItemIndicator>
            </span>
            <div className="flex flex-col gap-0.5">
              <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              {option.metadata && (
                <span className="text-xs text-text-muted">{option.metadata}</span>
              )}
            </div>
          </SelectPrimitive.Item>
        ))}
      </SelectContent>
    </Select>
  );
}
