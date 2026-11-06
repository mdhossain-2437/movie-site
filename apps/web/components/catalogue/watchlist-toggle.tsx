"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui";

export function WatchlistToggleButton({
  titleId,
  initialSaved,
  isAuthenticated,
}: {
  titleId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    if (!isAuthenticated) {
      router.push("/account");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/watchlist/${encodeURIComponent(titleId)}`, {
        method: saved ? "DELETE" : "POST",
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { detail?: string } | null;
        setError(body?.detail ?? "Could not update watchlist.");
        return;
      }
      setSaved(!saved);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant={saved ? "secondary" : "outline"}
        size="md"
        loading={loading}
        onClick={handleToggle}
      >
        {!isAuthenticated ? "Sign in to Save" : saved ? "✓ In My List" : "+ Add to My List"}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
