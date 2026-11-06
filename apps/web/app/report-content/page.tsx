import type { Metadata } from "next";
import { ReportContentForm } from "@/components/compliance/report-form";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Report Content or Rights Concern · CINEVA",
  description:
    "Submit a copyright, territorial licence, or metadata concern to the compliance team.",
};

export default function ReportContentPage() {
  return (
    <ConsumerShell>
      <header className="mb-8 space-y-3">
        <Badge tone="warning">Compliance &amp; Rights Notice</Badge>
        <h1 className="font-display text-text text-3xl font-bold sm:text-4xl">
          Report a Rights or Content Concern
        </h1>
        <p className="cg-prose text-text-secondary text-base leading-7">
          Every title on Cinematic Graphite requires documented ownership, distribution licensing,
          or counsel-reviewed public-domain evidence. Verified takedown notices trigger immediate
          emergency unpublish and legal hold.
        </p>
      </header>

      <div className="space-y-8">
        <ReportContentForm />

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/legal/takedown" variant="secondary" size="sm">
            Read Takedown Procedure
          </ButtonLink>
          <ButtonLink href="/legal/copyright" variant="outline" size="sm">
            Copyright Policy
          </ButtonLink>
        </div>
      </div>
    </ConsumerShell>
  );
}
