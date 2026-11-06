"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useSyncExternalStore } from "react";
import { Button } from "@/components/ui";

const emptySubscribe = () => () => {};

export function AccountAuthForms() {
  const hydrated = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const payload = mode === "login" ? { email, password } : { email, password, displayName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { detail?: string } | null;
        setError(problem?.detail ?? "Authentication request failed.");
        return;
      }
      setPassword("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="cg-surface max-w-xl p-6 sm:p-8">
      <div className="border-border flex flex-wrap gap-2 border-b pb-4">
        <Button
          variant={mode === "login" ? "primary" : "ghost"}
          size="sm"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
        >
          Sign In
        </Button>
        <Button
          variant={mode === "register" ? "primary" : "ghost"}
          size="sm"
          onClick={() => {
            setMode("register");
            setError(null);
          }}
        >
          Create Viewer Account
        </Button>
      </div>

      <form
        onSubmit={handleSubmit}
        data-hydrated={hydrated ? "true" : undefined}
        className="mt-6 space-y-4"
      >
        {mode === "register" ? (
          <div>
            <label htmlFor="auth-display-name" className="text-text block text-sm font-medium">
              Display name
            </label>
            <input
              id="auth-display-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="auth-email" className="text-text block text-sm font-medium">
            Email address
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            maxLength={180}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="auth-password" className="text-text block text-sm font-medium">
            Password <span className="text-text-muted text-xs">(minimum 10 characters)</span>
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            minLength={mode === "register" ? 10 : 1}
            maxLength={256}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border-border-strong bg-surface-2 text-text mt-1.5 min-h-11 w-full rounded-sm border px-3.5 py-2 text-sm"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="border-danger bg-surface-2 text-danger rounded-sm border px-3 py-2 text-xs"
          >
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          size="md"
          loading={loading}
          className="w-full sm:w-auto"
        >
          {mode === "login" ? "Sign In" : "Create Viewer Account"}
        </Button>
      </form>
    </section>
  );
}

export function AccountSessionControls({ requiresMfaStepUp }: { requiresMfaStepUp: boolean }) {
  const router = useRouter();
  const [totpCode, setTotpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleMfaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/v1/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totpCode }),
      });
      if (!res.ok) {
        const problem = (await res.json().catch(() => null)) as { detail?: string } | null;
        setMessage(problem?.detail ?? "Invalid code.");
        return;
      }
      setTotpCode("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {requiresMfaStepUp ? (
        <form onSubmit={handleMfaSubmit} className="cg-surface max-w-md space-y-3 p-5">
          <h3 className="font-display text-text text-base font-semibold">
            Verify Multi-Factor Authentication (TOTP)
          </h3>
          <p className="text-text-secondary text-xs">
            Your staff role requires MFA step-up before executing privileged mutations.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="mfa-totp-input" className="sr-only">
              6-digit authenticator code
            </label>
            <input
              id="mfa-totp-input"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              placeholder="000000"
              value={totpCode}
              onChange={(e) => setTotpCode(e.target.value)}
              className="border-border-strong bg-surface-2 text-text min-h-11 w-36 rounded-sm border px-3 py-1.5 font-mono text-sm"
            />
            <Button type="submit" variant="primary" size="sm" loading={loading}>
              Verify MFA
            </Button>
          </div>
          {message ? (
            <p role="alert" className="text-danger text-xs">
              {message}
            </p>
          ) : null}
        </form>
      ) : null}

      <Button variant="outline" size="sm" loading={loading} onClick={handleLogout}>
        Sign Out of Current Session
      </Button>
    </div>
  );
}

// Aliases for explicit auth form naming
export const AuthForms = AccountAuthForms;
