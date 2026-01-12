import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/contexts/AuthContext";
import { normalizeAuthError } from "@/lib/auth-errors";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login(): JSX.Element {
  const { login } = useAuth();
  const navigate = useNavigate();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await login(data.username, data.password);
      // Navigate directly to dashboard
      navigate({ to: "/dashboard", replace: true });
    } catch (error: unknown) {
      const message = normalizeAuthError(error);
      form.setError("root", { message: message || "Failed to login" });
    }
  });

  return (
    <div className="bg-base flex min-h-screen items-center justify-center px-4">
      <Card className="bg-surface/60 border-border w-full max-w-sm">
        <CardHeader>
          <h1 className="text-accent text-center text-2xl font-semibold">MyMemoryCard</h1>
          <p className="text-text-muted text-center text-sm">Welcome back</p>
        </CardHeader>
        <CardContent>
          <FormProvider {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              {form.formState.errors.root?.message ? (
                <div className="border-status-dropped/30 bg-status-dropped/10 text-status-dropped rounded-md border px-3 py-2 text-sm">
                  {form.formState.errors.root.message}
                </div>
              ) : null}
              <FormField name="username" label="Username" />
              <FormField name="password" label="Password" type="password" />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </FormProvider>
          <p className="text-text-muted mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-accent hover:text-accent">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
