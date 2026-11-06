"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Icon } from "@/components/ui/icon";

export function RecheckAccess() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      className="action-button action-outline"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.refresh())}
    >
      <Icon name="shield" />
      {pending ? "Checking rights…" : "Recheck availability"}
    </button>
  );
}
