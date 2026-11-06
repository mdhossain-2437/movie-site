import { ConsumerShell } from "@/components/layout/site-shell";
import { ButtonLink, EmptyState } from "@/components/ui";

export default function NotFound() {
  return (
    <ConsumerShell>
      <EmptyState
        eyebrow="404 · Not found"
        title="That page or title could not be found"
        description="The address may have changed, or the title is unpublished or unavailable in your region."
        actions={
          <>
            <ButtonLink href="/" variant="primary">
              Go to Home
            </ButtonLink>
            <ButtonLink href="/movies" variant="secondary">
              Browse Catalogue
            </ButtonLink>
          </>
        }
      />
    </ConsumerShell>
  );
}
