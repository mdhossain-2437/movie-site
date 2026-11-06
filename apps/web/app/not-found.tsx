import Link from "next/link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <ConsumerShell fullBleed>
      <section className="not-found-scene">
        <div className="not-found-frame" aria-hidden="true">
          <span>4</span>
          <span className="not-found-lens">
            <span />
          </span>
          <span>4</span>
        </div>
        <div className="not-found-copy">
          <p className="eyebrow">A frame out of place</p>
          <h1>
            This scene
            <br />
            isn’t in the cut.
          </h1>
          <p>
            The page may have moved, or the title hasn’t been published. Nothing unverified is
            served here.
          </p>
          <div>
            <Link href="/" className="action-button action-primary">
              Back to discover
              <Icon name="arrow-up-right" />
            </Link>
            <Link href="/search" className="text-link">
              <Icon name="search" />
              Search the archive
            </Link>
          </div>
        </div>
      </section>
    </ConsumerShell>
  );
}
