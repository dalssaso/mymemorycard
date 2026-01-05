import { Link } from "@tanstack/react-router"
import { Button, Card } from "@/components/ui"

export function NotFound(): JSX.Element {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <Card className="max-w-md p-8 text-center">
        <h1 className="text-2xl font-semibold text-ctp-text">Page not found</h1>
        <p className="mt-2 text-sm text-ctp-subtext1">
          The page you are looking for does not exist or has been moved.
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </Card>
    </div>
  )
}
