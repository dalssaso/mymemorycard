import { useFormContext } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface FormFieldProps {
  name: string
  label: string
  type?: string
}

export function FormField({ name, label, type = "text" }: FormFieldProps): JSX.Element {
  const {
    register,
    formState: { errors },
  } = useFormContext()
  const error = errors[name]

  return (
    <div className="space-y-1">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} type={type} {...register(name)} />
      {error && <p className="text-sm text-destructive">{String(error.message)}</p>}
    </div>
  )
}
