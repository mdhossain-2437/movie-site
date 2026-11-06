"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import { Badge, Button } from "@/components/ui";

const emptySubscribe = () => () => {};

export function ReportContentForm() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const [targetPath, setTargetPath] = useState("");
  const [titleSlug, setTitleSlug] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterEmail, setReporterEmail] = useState("");
  const [claimSummary, setClaimSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetPath,
          titleSlug: titleSlug.trim() || undefined,
          reporterName,
          reporterEmail,
          claimSummary,
        }),
      });
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { detail?: string } | null;
        setError(problem?.detail ?? "Could not submit report.");
        return;
      }
      const data = (await res.json()) as { caseNumber: string };
      setCaseNumber(data.caseNumber);
      setClaimSummary("");
    } finally {
      setLoading(false);
    }
  }

  if (caseNumber) {
    return (
      <section className="cg-surface space-y-3 p-6 sm:p-8" aria-live="polite">
        <Badge tone="success">Case Logged</Badge>
        <h2 className="font-display text-text text-xl font-semibold">Compliance report recorded</h2>
        <p className="text-text-secondary text-sm">
          Reference case number:{" "}
          <code className="text-accent font-mono font-semibold">{caseNumber}</code>. Our rights
          review team preserves all submitted evidence in the immutable audit log.
        </p>
        <Button variant="secondary" size="sm" onClick={() => setCaseNumber(null)}>
          Submit Another Notice
        </Button>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      data-hydrated={hydrated ? "true" : undefined}
      className="cg-surface max-w-2xl space-y-4 p-6 sm:p-8"
    >
      <h2 className="font-display text-text text-xl font-semibold">Submit a Formal Notice</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="report-name" className="text-text block text-sm font-medium">
            Your name or organization
          </label>
          <input
            id="report-name"
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="report-email" className="text-text block text-sm font-medium">
            Contact email
          </label>
          <input
            id="report-email"
            type="email"
            required
            maxLength={180}
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="report-path" className="text-text block text-sm font-medium">
            Observed page path
          </label>
          <input
            id="report-path"
            type="text"
            required
            placeholder="/movies/example-slug"
            maxLength={256}
            value={targetPath}
            onChange={(e) => setTargetPath(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="report-slug" className="text-text block text-sm font-medium">
            Title slug <span className="text-text-muted text-xs">(optional)</span>
          </label>
          <input
            id="report-slug"
            type="text"
            maxLength={120}
            value={titleSlug}
            onChange={(e) => setTitleSlug(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="report-summary" className="text-text block text-sm font-medium">
          Claim details &amp; territorial/ownership basis
        </label>
        <textarea
          id="report-summary"
          required
          minLength={20}
          maxLength={4000}
          rows={4}
          value={claimSummary}
          onChange={(e) => setClaimSummary(e.target.value)}
          className="border-border-strong bg-surface-2 text-text mt-1.5 w-full rounded-sm border px-3.5 py-2.5 text-sm"
        />
      </div>

      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="md" loading={loading}>
        Log Compliance Report
      </Button>
    </form>
  );
}
