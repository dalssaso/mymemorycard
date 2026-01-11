import { Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { useAuth } from "@/contexts/AuthContext";

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
      let message: string | null = null;
      if (error && typeof error === "object" && "response" in error) {
        const responseError = (error as { response?: { data?: { error?: unknown } } }).response
          ?.data?.error;
        // Handle both string errors and Zod validation error objects
        if (typeof responseError === "string") {
          message = responseError;
        } else if (responseError && typeof responseError === "object" && "message" in responseError) {
          message = String((responseError as { message: unknown }).message);
        }
      }
      form.setError("root", { message: message ?? "Failed to login" });
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-ctp-base px-4">
      <Card className="bg-ctp-surface0/60 w-full max-w-sm border-ctp-surface1">
        <CardHeader>
          <h1 className="text-center text-2xl font-semibold text-ctp-mauve">MyMemoryCard</h1>
          <p className="text-center text-sm text-ctp-subtext1">Welcome back</p>
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
              <FormField name="password" label="Password" type="password" />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </form>
          </FormProvider>
          <p className="mt-4 text-center text-sm text-ctp-subtext1">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="text-ctp-teal hover:text-ctp-sky">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
