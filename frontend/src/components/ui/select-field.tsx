import type { ReactNode } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectItemText,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  "aria-label"?: string;
  "aria-describedby"?: string;
}

export function SelectField({
  id,
  value,
  options,
  onChange,
  placeholder,
  className,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedby,
}: SelectFieldProps): JSX.Element {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        className={className}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            <div className="flex flex-col gap-0.5">
              <SelectItemText>{option.label}</SelectItemText>
              {option.metadata && (
                <span className="text-xs text-text-muted">{option.metadata}</span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
