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
          <p className="eyebrow">404 · That page or title could not be found</p>
          <h1>
            This scene
            <br />
            isn’t in the cut.
          </h1>
          <p>
            The page may have moved, or the title hasn’t been published in your territory. Nothing
            unverified is served here.
          </p>
          <div>
            <Link href="/" className="action-button action-primary">
              Back to discover
              <Icon name="arrow-up-right" />
            </Link>
            <Link href="/movies" className="text-link">
              <Icon name="search" />
              Browse catalogue
            </Link>
          </div>
        </div>
      </section>
    </ConsumerShell>
  );
}
