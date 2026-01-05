import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/contexts/AuthContext";

const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

const registerSchema = z
  .object({
    username: z.string().min(1, "Username is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(strongPassword, "Use upper, lower, number, and symbol characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type RegisterForm = z.infer<typeof registerSchema>;

export function Register(): JSX.Element {
  const { register } = useAuth();
  const navigate = useNavigate();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");
  const confirmPassword = form.watch("confirmPassword");
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const passwordStrong = strongPassword.test(password);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await register(data.username, data.password);
      navigate({ to: "/platforms/onboarding" });
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { error?: string } } }).response?.data?.error
          : null;
      form.setError("root", { message: message ?? "Failed to create account" });
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-ctp-base px-4">
      <Card className="bg-ctp-surface0/60 w-full max-w-sm border-ctp-surface1">
        <CardHeader>
          <h1 className="text-center text-2xl font-semibold text-ctp-mauve">Create Account</h1>
          <p className="text-center text-sm text-ctp-subtext1">Start organizing your library</p>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {form.formState.errors.root?.message ? (
                <div className="border-ctp-red/30 bg-ctp-red/10 rounded-md border px-3 py-2 text-sm text-ctp-red">
                  {form.formState.errors.root.message}
                </div>
              ) : null}
              <FormField name="username" label="Username" />
              <div className="space-y-2">
                <FormField name="password" label="Password" type="password" />
                {password.length > 0 ? (
                  <p className={`text-xs ${passwordStrong ? "text-ctp-green" : "text-ctp-red"}`}>
                    {passwordStrong
                      ? "Password looks strong"
                      : "Use 8+ chars with upper, lower, number, and symbol"}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <FormField name="confirmPassword" label="Confirm password" type="password" />
                {confirmPassword.length > 0 ? (
                  <p className={`text-xs ${passwordsMatch ? "text-ctp-green" : "text-ctp-red"}`}>
                    {passwordsMatch ? "Passwords match" : "Passwords do not match"}
                  </p>
                ) : null}
              </div>
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Creating account..." : "Register"}
              </Button>
            </form>
          </FormProvider>
          <p className="mt-4 text-center text-sm text-ctp-subtext1">
            Already have an account?{" "}
            <Link to="/login" className="text-ctp-teal hover:text-ctp-sky">
              Login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
