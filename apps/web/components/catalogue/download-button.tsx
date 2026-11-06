"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function AuthorizedDownloadButton({
  assetId,
  isAuthenticated,
}: {
  assetId: string;
  isAuthenticated: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDownload() {
    if (!isAuthenticated) {
      setErrorMessage("Sign in to request a short-lived authorized download link.");
      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch(`/api/v1/downloads/${encodeURIComponent(assetId)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const payload = (await res.json()) as {
        downloadUrl?: string;
        resolution?: string;
        detail?: string;
      };

      if (!res.ok || !payload.downloadUrl) {
        setErrorMessage(payload.detail ?? "Download authorization was denied by rights policy.");
        return;
      }

      setStatusMessage(
        `Authorized ${payload.resolution ?? "HD"} copy issued (single-object signed link expires in 5 minutes).`,
      );
      window.open(payload.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      setErrorMessage("Network error while requesting download authorization.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-1.5">
      <Button type="button" variant="secondary" size="md" loading={busy} onClick={handleDownload}>
        {busy ? "Verifying Download Rights…" : "Download Authorized Copy"}
      </Button>
      {statusMessage ? (
        <p role="status" className="text-success text-xs">
          {statusMessage}
        </p>
      ) : null}
      {errorMessage ? (
        <p role="alert" className="text-danger text-xs">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
