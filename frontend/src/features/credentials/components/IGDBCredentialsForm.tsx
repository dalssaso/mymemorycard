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
          client_id: clientId,
          client_secret: clientSecret,
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
    <div className="space-y-6 rounded-lg border border-slate-700 bg-slate-800/50 p-6">
      <div>
        <h3 className="text-lg font-semibold text-white">IGDB Credentials</h3>
        <p className="text-sm text-slate-400">
          Required for game search and metadata. Get your credentials from the{" "}
          <a
            href="https://api.igdb.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300"
          >
            IGDB API console
          </a>
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="client-id" className="text-slate-300">
            Twitch Client ID
          </Label>
          <Input
            id="client-id"
            type="password"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setSaveStatus("idle");
            }}
            placeholder="your-client-id"
            className="mt-2 bg-slate-900 text-white placeholder-slate-500"
            autoComplete="off"
          />
        </div>

        <div>
          <Label htmlFor="client-secret" className="text-slate-300">
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
            className="mt-2 bg-slate-900 text-white placeholder-slate-500"
            autoComplete="off"
          />
        </div>
      </div>

      {saveStatus === "error" && (
        <div className="rounded bg-red-900/30 p-3 text-sm text-red-300">
          Failed to save credentials. Please check your ID and secret.
        </div>
      )}

      {saveStatus === "success" && (
        <div className="rounded bg-green-900/30 p-3 text-sm text-green-300">
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
