"use client";

import { Button, ButtonLink, ErrorState } from "@/components/ui";

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main id="main" className="cg-container flex flex-1 flex-col justify-center py-16">
      <ErrorState
        title="Something interrupted this view"
        description="The request could not be completed safely. Try again, or return to the home screen."
        correlationId={error.digest}
        actions={
          <>
            <Button variant="primary" onClick={() => reset()}>
              Retry
            </Button>
            <ButtonLink href="/" variant="secondary">
              Back to Home
            </ButtonLink>
          </>
        }
      />
    </main>
  );
}
