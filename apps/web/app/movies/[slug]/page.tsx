import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/layout/site-shell";
import {
  ArtBackdrop,
  Breadcrumbs,
  CreditName,
  FixtureNotice,
  MetadataChips,
  SectionHeading,
} from "@/components/catalogue/common";
import { TitleRail } from "@/components/catalogue/editorial";
import { RightsPanel } from "@/components/catalogue/rights-panel";
import { SaveButton, ShareButton } from "@/components/experience/actions";
import { Synopsis } from "@/components/experience/synopsis";
import { Icon } from "@/components/ui/icon";
import { getTitle, titleStaticParams } from "@/lib/catalogue/repository";
import { formatRuntime, pad2, splitDisplayTitle } from "@/lib/catalogue/format";

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
  return detail
    ? {
        title: `${detail.card.title} (${detail.card.year})`,
        description: `${detail.card.synopsis} Development catalogue reference; rights verification pending.`,
      }
    : { title: "Film not found" };
}

export default async function MoviePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = getTitle(slug);
  if (!detail) notFound();
  const { card } = detail;
  const parts = splitDisplayTitle(card.title);
  const leadDirector = detail.directors[0];
  return (
    <ConsumerShell fullBleed>
      <section className="detail-hero">
        <ArtBackdrop spec={card.art} />
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/" },
            { label: "Films", href: "/movies" },
            ...(leadDirector?.personSlug
              ? [{ label: leadDirector.name, href: `/people/${leadDirector.personSlug}` }]
              : []),
            { label: card.title },
          ]}
        />
        <div className="detail-hero-top">
          <div>
            <p className="eyebrow">An archive reference / {card.year}</p>
            <h1 className={`detail-title ${card.title.length > 30 ? "detail-title-long" : ""}`}>
              {parts.map((part, i) => (
                <span key={part} className={i > 0 ? "detail-subtitle" : ""}>
                  {part}
                </span>
              ))}
            </h1>
            <p lang="bn" className="detail-title-bn">
              {card.titleBn}
            </p>
          </div>
          <div className="detail-intro">
            <p>{card.synopsis}</p>
            <p className="detail-director-label">
              A film by{" "}
              {detail.directors.map((credit, i) => (
                <span key={credit.name}>
                  {i > 0 ? " & " : ""}
                  <CreditName credit={credit} />
                </span>
              ))}
            </p>
            <span className="detail-access-label">
              <Icon name="lock" />
              Rights verification pending
            </span>
          </div>
        </div>
        <Link
          href={`/watch/${card.slug}`}
          className="detail-play"
          aria-label={`Open locked playback information for ${card.title}`}
        >
          <span className="hero-play-circle">
            <Icon name="lock" />
          </span>
          <span>Playback locked</span>
        </Link>
        <div className="detail-action-rail">
          <SaveButton slug={card.slug} title={card.title} compact />
          <ShareButton title={card.title} path={`/movies/${card.slug}`} compact />
          <a
            className="icon-button"
            href="#availability"
            title="Rights & availability"
            aria-label="View rights and availability"
          >
            <Icon name="shield" />
          </a>
        </div>
        <div className="detail-hero-bottom">
          <dl className="hero-facts">
            <div>
              <dt>Country</dt>
              <dd>
                {card.countries.map((country) => (
                  <span key={country}>{country}</span>
                ))}
              </dd>
            </div>
            <div>
              <dt>Studio</dt>
              <dd>
                <span>{card.studio}</span>
              </dd>
            </div>
            <div>
              <dt>Runtime</dt>
              <dd>
                <span>≈ {formatRuntime(card.runtimeMinutes)}</span>
              </dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>
                <span>{card.year}</span>
              </dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>
                <span>Silent</span>
                <span>Unrated</span>
              </dd>
            </div>
          </dl>
          <div className="detail-hero-note">
            <span className="status-square" aria-hidden="true" />
            Development fixture
            <br />
            <span>Original generated key art. No playable media.</span>
          </div>
        </div>
      </section>
      <div className="detail-body">
        <nav className="detail-section-nav" aria-label="Film sections">
          <a href="#overview">Overview</a>
          <a href="#credits">Cast &amp; crew</a>
          <a href="#availability">Rights &amp; availability</a>
          {detail.moreFromDirectors.length + detail.related.length > 0 ? (
            <a href="#related">
              Keep exploring
              <Icon name="arrow-up-right" />
            </a>
          ) : null}
        </nav>
        <div className="detail-overview-grid">
          <div>
            <section id="overview" className="story-section">
              <p className="eyebrow">Behind the frame</p>
              <h2>The story.</h2>
              <Synopsis english={card.synopsis} bangla={card.synopsisBn} />
              <MetadataChips card={card} />
              <dl className="film-specs">
                <div>
                  <dt>Original title</dt>
                  <dd>{detail.originalTitle}</dd>
                </div>
                <div>
                  <dt>Language &amp; sound</dt>
                  <dd>{detail.soundFormat}</dd>
                </div>
                <div>
                  <dt>Version note</dt>
                  <dd>
                    Runtime is approximate; silent-era restorations and projection speeds vary.
                  </dd>
                </div>
                <div>
                  <dt>Audio &amp; subtitles</dt>
                  <dd>
                    No media asset ingested. Tracks and accessibility features are not yet supplied.
                  </dd>
                </div>
                <div>
                  <dt>Artwork provenance</dt>
                  <dd>
                    Original operator-generated SVG illustration, composed in code for this
                    development preview.
                  </dd>
                </div>
                <div>
                  <dt>Metadata provenance</dt>
                  <dd>
                    Development editorial reference. Factual source verification is required before
                    publication.
                  </dd>
                </div>
              </dl>
            </section>
            <section id="credits" className="credits-section">
              <SectionHeading
                eyebrow="The people who made it"
                title="Cast & crew."
                count={detail.directors.length + detail.writers.length + detail.cast.length}
              />
              <div className="crew-list">
                {[...detail.directors, ...detail.writers].map((credit, i) => (
                  <div key={`${credit.department}-${credit.name}`}>
                    <span className="credit-number">{pad2(i + 1)}</span>
                    <CreditName credit={credit} />
                    <span className="credit-role">
                      {credit.department === "DIRECTOR" ? "Director" : "Writer"}
                    </span>
                  </div>
                ))}
              </div>
              {detail.cast.length > 0 ? (
                <div className="cast-grid">
                  {detail.cast.map((credit) => (
                    <div className="cast-card" key={credit.name}>
                      <span className="cast-initial" aria-hidden="true">
                        {credit.name
                          .split(" ")
                          .map((part) => part[0])
                          .slice(0, 2)
                          .join("")}
                      </span>
                      <div>
                        <CreditName credit={credit} />
                        <span className="cast-character">{credit.character ?? "Performer"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
            {detail.collections.length > 0 ? (
              <section className="belongs-section">
                <p className="eyebrow">Part of a bigger story</p>
                {detail.collections.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    className="belongs-link"
                    key={collection.slug}
                  >
                    <Icon name="collection" />
                    <span>{collection.title}</span>
                    <Icon name="arrow-up-right" />
                  </Link>
                ))}
              </section>
            ) : null}
          </div>
          <RightsPanel detail={detail} />
        </div>
        <FixtureNotice />
        <div id="related">
          <TitleRail
            cards={detail.moreFromDirectors}
            title="The same vision. Another story."
            eyebrow="More from the filmmaker"
            href={leadDirector?.personSlug ? `/people/${leadDirector.personSlug}` : undefined}
            linkLabel="Full filmography"
          />
          <TitleRail
            cards={detail.related}
            title="Keep the conversation going."
            eyebrow="Connected by genre, not popularity"
          />
        </div>
      </div>
    </ConsumerShell>
  );
}
