import { useState } from "react";
import { useSaveCredentials } from "../hooks/useCredentials";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Form for saving IGDB API credentials (Twitch Client ID + Secret).
 * Guides users through obtaining and entering their IGDB/Twitch credentials.
 */
export function IGDBCredentialsForm(): JSX.Element {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const saveCredentials = useSaveCredentials();

  const isValid = clientId.trim().length > 0 && clientSecret.trim().length > 0;

  const handleSave = (): void => {
    if (!isValid) return;

    saveCredentials.mutate(
      {
        service: "igdb" as const,
        credential_type: "twitch_oauth" as const,
        credentials: {
          client_id: clientId.trim(),
          client_secret: clientSecret.trim(),
        },
      },
      {
        onSuccess: () => {
          setSaveStatus("success");
          setClientId("");
          setClientSecret("");
        },
        onError: () => {
          setSaveStatus("error");
        },
      }
    );
  };

  return (
    <div className="bg-surface/50 space-y-6 rounded-lg border border-border p-6">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">IGDB Credentials</h3>
        <p className="text-sm text-text-secondary">
          Required for game search and metadata. Get your credentials from the{" "}
          <a
            href="https://api.igdb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-accent/80 text-accent"
          >
            IGDB API console
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="client-id" className="text-text-primary">
            Twitch Client ID
          </Label>
          <Input
            id="client-id"
            type="text"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSaveStatus("idle");
            }}
            placeholder="your-client-id"
            className="mt-2 bg-base text-text-primary placeholder:text-text-muted"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="client-secret" className="text-text-primary">
            Twitch Client Secret
          </Label>
          <Input
            id="client-secret"
            type="password"
            value={clientSecret}
            onChange={(e) => {
              setClientSecret(e.target.value);
              setSaveStatus("idle");
            }}
            placeholder="your-client-secret"
            className="mt-2 bg-base text-text-primary placeholder:text-text-muted"
            autoComplete="off"
          />
        </div>
      </div>

      {saveStatus === "error" && (
        <div className="bg-destructive/30 rounded p-3 text-sm text-destructive">
          Failed to save credentials. Please check your ID and secret.
        </div>
      )}

      {saveStatus === "success" && (
        <div className="bg-status-playing/30 rounded p-3 text-sm text-status-playing">
          Credentials saved successfully!
        </div>
      )}

      <Button
        onClick={handleSave}
        disabled={!isValid || saveCredentials.isPending}
        className="w-full"
      >
        {saveCredentials.isPending ? "Saving..." : "Save Credentials"}
      </Button>
    </div>
  );
}
