import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { getCatalogueMode } from "@/lib/catalogue/repository";
import { formatRuntime, slugify } from "@/lib/catalogue/format";
import type { ResolvedCredit, TitleCard } from "@/lib/catalogue/types";

export { ArtBackdrop } from "@/components/art/backdrop";

export function SectionHeading({
  eyebrow,
  title,
  count,
  href,
  linkLabel = "Explore all",
  children,
}: {
  eyebrow?: string;
  title: string;
  count?: number;
  href?: string;
  linkLabel?: string;
  children?: ReactNode;
}) {
  return (
    <header className="section-heading">
      <div>
        {eyebrow ? (
          <p className="eyebrow">
            <span className="tiny-cross" aria-hidden="true">
              +
            </span>
            {eyebrow}
          </p>
        ) : null}
        <h2>
          {title}
          {count !== undefined ? <sup>{String(count).padStart(2, "0")}</sup> : null}
        </h2>
        {children}
      </div>
      {href ? (
        <Link className="text-link" href={href}>
          {linkLabel}
          <Icon name="arrow-up-right" />
        </Link>
      ) : null}
    </header>
  );
}

export function FixtureNotice({ compact = false }: { compact?: boolean }) {
  if (getCatalogueMode() !== "fixtures") return null;
  return compact ? (
    <p className="fixture-caption">
      <span className="status-square" aria-hidden="true" />
      Development fixtures · rights verification pending{" "}
      <Link href="/legal/copyright#development-fixtures" aria-label="About development fixtures">
        <Icon name="info" />
      </Link>
    </p>
  ) : (
    <aside className="fixture-notice">
      <Icon name="info" />
      <div>
        <strong>Development catalogue, not a streaming offer.</strong>
        <p>
          Real early-film references with original generated artwork. Publication, legal review and
          playback rights remain pending.{" "}
          <Link href="/legal/copyright#development-fixtures">
            About these fixtures <Icon name="arrow-up-right" />
          </Link>
        </p>
      </div>
    </aside>
  );
}

export function MetadataChips({ card, genres = true }: { card: TitleCard; genres?: boolean }) {
  return (
    <div className="metadata-chips">
      <span>{card.year}</span>
      <span title="Approximate runtime; silent-era versions vary">
        ≈ {formatRuntime(card.runtimeMinutes)}
      </span>
      {genres
        ? card.genres.slice(0, 2).map((genre) => (
            <Link href={`/genres/${slugify(genre)}`} key={genre}>
              {genre}
            </Link>
          ))
        : null}
      <span>Silent</span>
    </div>
  );
}

export function CreditName({ credit }: { credit: ResolvedCredit }) {
  return credit.personSlug ? (
    <Link href={`/people/${credit.personSlug}`} className="credit-link">
      {credit.name}
      <Icon name="arrow-up-right" />
    </Link>
  ) : (
    <span>{credit.name}</span>
  );
}

export function EmptyArchive({
  title = "The next chapter is being curated.",
  description = "The public catalogue is empty while editorial records and territorial rights complete review.",
  compact = false,
}: {
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <section className={`empty-archive ${compact ? "empty-archive-compact" : ""}`}>
      <span className="empty-archive-symbol" aria-hidden="true">
        <Icon name="films" />
      </span>
      <p className="eyebrow">A deliberate pause</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="empty-actions">
        <Link href="/legal/copyright" className="action-button action-primary">
          <Icon name="shield" />
          Our rights-first approach
        </Link>
        <Link href="/search" className="text-link">
          Search the archive
          <Icon name="arrow" />
        </Link>
      </div>
    </section>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="breadcrumbs">
      <ol>
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`}>
            {i > 0 ? <Icon name="chevron" /> : null}
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
