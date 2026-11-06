import type { Metadata } from "next";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Report Content or Rights Concern · Cinematic Graphite",
  description:
    "How rights holders and viewers report copyright, territorial licence, or metadata concerns.",
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

      <section className="cg-surface cg-prose space-y-5 p-6 sm:p-8">
        <h2 className="font-display text-text text-xl font-semibold">
          Information required for a formal rights notice
        </h2>
        <ul className="text-text-secondary list-disc space-y-2.5 pl-5 text-sm leading-6">
          <li>
            Identification of the copyrighted work or licensed territory claimed to be affected.
          </li>
          <li>
            The exact page path or title slug on this platform where the material was observed.
          </li>
          <li>
            Contact details and authority statement confirming you are the rights holder or
            authorized representative.
          </li>
          <li>
            Supporting documentation or reference IDs so our compliance reviewer can place an
            immediate legal hold and preserve audit evidence.
          </li>
        </ul>
        <p className="text-text-muted text-sm leading-6">
          Interactive intake persistence and automated case tracking numbers activate with the
          Takedown &amp; Legal Hold workflow. Review the full procedure in our Takedown Policy.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <ButtonLink href="/legal/takedown" variant="primary">
            Read Takedown Procedure
          </ButtonLink>
          <ButtonLink href="/legal/copyright" variant="secondary">
            Copyright Policy
          </ButtonLink>
        </div>
      </section>
    </ConsumerShell>
  );
}
