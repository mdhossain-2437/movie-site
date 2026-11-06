import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { ConsumerShell } from "@/components/layout/site-shell";
import { ArtBackdrop } from "@/components/art/backdrop";
import { FixtureNotice } from "@/components/catalogue/common";
import { RecheckAccess } from "@/components/experience/recheck-access";
import { Icon } from "@/components/ui/icon";
import { authorizePlayback, getTitle, titleStaticParams } from "@/lib/catalogue/repository";
import { formatRuntime } from "@/lib/catalogue/format";

export function generateStaticParams() {
  return titleStaticParams();
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getTitle(slug);
  return {
    title: detail ? `Playback status — ${detail.card.title}` : "Playback unavailable",
    robots: { index: false, follow: false },
  };
}

async function PlaybackGate({ slug }: { slug: string }) {
  // Authorization must use request time, never the statically rendered catalogue snapshot.
  await connection();
  const result = authorizePlayback(slug, new Date());
  if (!result) notFound();
  const denial = !result.stream.allowed ? result.stream : null;
  return (
    <>
      <section className="locked-player" aria-label="Playback authorization status">
        <ArtBackdrop spec={result.card.art} />
        <div className="player-status-top">
          <span>
            <span className="status-square" aria-hidden="true" />
            No media loaded
          </span>
          <span>Development fixture</span>
        </div>
        <div className="player-denial">
          <span className="player-lock">
            <Icon name="lock" />
          </span>
          <p className="eyebrow">Access is not approved</p>
          <h2>
            Some stories
            <br />
            need a little more time.
          </h2>
          <p>
            {denial?.publicReason ??
              "No media asset is connected. Playback is not available in this preview."}{" "}
            Rights review and an approved, ingested media version are required before playback can
            begin.
          </p>
          <div>
            <RecheckAccess />
            <Link href={`/movies/${slug}`} className="text-link">
              Back to the film
              <Icon name="arrow-up-right" />
            </Link>
          </div>
        </div>
        <div className="player-status-bottom">
          <span>{denial?.code ?? "NO_MEDIA_ASSET"}</span>
          <span>No manifest, segment or download URL issued</span>
        </div>
      </section>
      <div className="watch-info">
        <div>
          <p className="eyebrow">Transparent by design</p>
          <h2>Why playback is locked.</h2>
          <p>
            There are no pretend play buttons or hidden third-party streams here. The server checked
            this request against the central rights policy.
          </p>
          <dl className="watch-evaluation">
            <div>
              <dt>Territory context</dt>
              <dd>{result.territory} · configured preview territory, not geolocation</dd>
            </div>
            <div>
              <dt>Evaluated at</dt>
              <dd>
                <time dateTime={result.evaluatedAt}>
                  {result.evaluatedAt.replace("T", " ").slice(0, 19)} UTC
                </time>
              </dd>
            </div>
            <div>
              <dt>Policy</dt>
              <dd>{result.stream.policyVersion}</dd>
            </div>
            <div>
              <dt>Download</dt>
              <dd>
                {result.download.allowed
                  ? "Policy permits this action; no file is connected"
                  : "Not authorized · checked independently of streaming"}
              </dd>
            </div>
          </dl>
          <Link href="/legal/copyright" className="text-link">
            Read our rights policy
            <Icon name="arrow-up-right" />
          </Link>
        </div>
        <ol className="authorization-facts">
          {result.facts.map((fact, i) => (
            <li key={fact.label}>
              <span className={`fact-icon fact-${fact.state}`}>
                <Icon
                  name={fact.state === "pass" ? "check" : fact.state === "fail" ? "lock" : "info"}
                />
              </span>
              <div>
                <span className="fact-number">{String(i + 1).padStart(2, "0")}</span>
                <h3>{fact.label}</h3>
                <p>{fact.value}</p>
              </div>
              <span className="fact-label">
                {fact.state === "fail" ? "Blocked" : fact.state === "pass" ? "Recorded" : "Context"}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

export default async function WatchPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getTitle(slug);
  if (!detail) notFound();
  return (
    <ConsumerShell>
      <header className="watch-header">
        <Link href={`/movies/${slug}`} className="text-link">
          <Icon name="arrow-left" />
          Back to title
        </Link>
        <div>
          <h1>{detail.card.title}</h1>
          <p>
            {detail.card.year} / ≈ {formatRuntime(detail.card.runtimeMinutes)}
          </p>
        </div>
        <span className="watch-header-label">
          <Icon name="shield" />
          Rights-gated playback
        </span>
      </header>
      <Suspense
        fallback={
          <section className="locked-player player-authorizing" aria-busy="true">
            <Icon name="shield" />
            <p className="eyebrow">Checking server authorization…</p>
          </section>
        }
      >
        <PlaybackGate slug={slug} />
      </Suspense>
      <FixtureNotice />
    </ConsumerShell>
  );
}
