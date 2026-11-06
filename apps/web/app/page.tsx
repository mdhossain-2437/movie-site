import type { Metadata } from "next";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { ConsumerShell } from "@/components/layout/site-shell";
import { AvailabilityBadge, Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Home · Cinematic Graphite",
  description:
    "Lawful movie discovery and rights-gated media distribution platform. Only owned, licensed, or counsel-verified public-domain films are published.",
};

const DEFAULT_EDITORIAL_FIXTURES: FilmStripItem[] = [
  {
    id: "fix-the-last-monsoon",
    slug: "the-last-monsoon",
    titleEn: "The Last Monsoon",
    titleBn: "শেষ বর্ষা",
    releaseYear: 2024,
    runtimeMinutes: 118,
    maturityRating: "PG13",
    synopsisEn:
      "A rain-drenched neo-noir tracking an archivist uncovering coastal land syndicates in Old Dhaka.",
    badgeKind: "stream_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-neon-bhasha",
    slug: "neon-bhasha",
    titleEn: "Neon Bhasha",
    titleBn: "নিয়ন ভাষা",
    releaseYear: 2023,
    runtimeMinutes: 104,
    maturityRating: "PG13",
    synopsisEn:
      "Cybernetic acoustic linguistics in a subterranean delta megacity running on analog relays.",
    badgeKind: "stream_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-shadows-over-buriganga",
    slug: "shadows-over-buriganga",
    titleEn: "Shadows Over Buriganga",
    titleBn: "বুড়িগঙ্গার ছায়া",
    releaseYear: 2022,
    runtimeMinutes: 132,
    maturityRating: "R16",
    synopsisEn:
      "A river police captain uncovers counterfeit chemical manifests drifting between river barges.",
    badgeKind: "stream_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-echoes-of-the-delta",
    slug: "echoes-of-the-delta",
    titleEn: "Echoes of the Delta",
    titleBn: "বদ্বীপের প্রতিধ্বনি",
    releaseYear: 2021,
    runtimeMinutes: 92,
    maturityRating: "U",
    synopsisEn:
      "Archival soundscapes of century-old wooden paddle steamers traversing the Sundarbans channels.",
    badgeKind: "download_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-midnight-at-curzon-hall",
    slug: "midnight-at-curzon-hall",
    titleEn: "Midnight at Curzon Hall",
    titleBn: "কার্জন হলে মধ্যরাত",
    releaseYear: 2024,
    runtimeMinutes: 126,
    maturityRating: "PG13",
    synopsisEn:
      "A mathematical mystery unfolding across red-brick collegiate corridors during curfew.",
    badgeKind: "stream_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-voyage-beyond-stars",
    slug: "voyage-beyond-stars",
    titleEn: "Voyage Beyond Stars",
    titleBn: "নক্ষত্রের ওপারে যাত্রা",
    releaseYear: 2025,
    runtimeMinutes: 140,
    maturityRating: "PG",
    synopsisEn:
      "A cosmic expedition navigating deep stellar magnetic storms to recover lost signal archives.",
    badgeKind: "stream_allowed",
    isDevelopmentFixture: true,
  },
  {
    id: "fix-symphony-of-the-loom",
    slug: "symphony-of-the-loom",
    titleEn: "Symphony of the Loom",
    titleBn: "তাঁতের সিম্ফনি",
    releaseYear: 2020,
    runtimeMinutes: 85,
    maturityRating: "U",
    synopsisEn:
      "The meditative, rhythmic visual poetry of traditional Jamdani master weavers along the Shitalakshya.",
    badgeKind: "download_allowed",
    isDevelopmentFixture: true,
  },
];

const FOUNDATION_MODULES = [
  {
    name: "Design System & Accessibility",
    state: "Active",
    tone: "success" as const,
    detail:
      "Cinematic Graphite semantic tokens, self-hosted typography, keyboard skip-links, and 360px–1920px responsive shell.",
  },
  {
    name: "Central Rights Decision Engine",
    state: "Active",
    tone: "success" as const,
    detail:
      "Deny-by-default server policy enforcing territory, date windows, separate stream/download rights, legal holds, and DRM gates.",
  },
  {
    name: "PostgreSQL Persistence, Sessions & DAL",
    state: "Active",
    tone: "success" as const,
    detail:
      "26-table relational schema, scrypt + TOTP MFA revocable sessions, separation-of-duties rights approval, and Bangla/English search.",
  },
  {
    name: "Private Quarantine Ingest & Adaptive Playback",
    state: "Active",
    tone: "success" as const,
    detail:
      "Multipart quarantine uploads, safe header/ffprobe validation, durable outbox worker, server-authorized playback sessions, and fail-closed DRM boundary.",
  },
] as const;

export default function Home() {
  return (
    <ConsumerShell>
      <section aria-labelledby="hero-heading" className="py-6 sm:py-10">
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge tone="accent">Milestone M2 · Cinematic Editorial UI/UX Upgrade</Badge>
          <AvailabilityBadge kind="stream_allowed" />
        </div>

        <h1
          id="hero-heading"
          className="font-display text-text mt-5 max-w-3xl text-[length:var(--cg-text-4xl)] leading-tight font-bold text-balance sm:text-[length:var(--cg-text-display)]"
        >
          The catalogue opens only to verified rights.
        </h1>

        <p className="cg-prose text-text-secondary mt-5 text-lg leading-8">
          Cinematic Graphite lists and delivers only films that the operator owns, holds a
          documented distribution licence for, or has verified for public-domain release. No
          unverified uploads, scraped streams, or unauthorized mirrors are permitted.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <ButtonLink href="/movies" variant="primary" size="lg">
            Browse Catalogue
          </ButtonLink>
          <ButtonLink href="/collections/monsoon-noir-archive" variant="secondary" size="lg">
            Curated Collections
          </ButtonLink>
          <ButtonLink href="/people/amina-rahman" variant="outline" size="lg">
            Featured Director
          </ButtonLink>
        </div>
      </section>

      {/* Concept #1: Vertical Film-Strip Showcase Stage */}
      <FilmStripShowcase
        breadcrumbTitle="Monsoon Noir & Archival Vault"
        breadcrumbCategory="Editorial"
        watermarkText="GRAPHITE"
        heading="Curated Showcase Stage"
        subheading="Atmospheric 7-panel interactive vertical gallery. Hover to elevate warm gold illumination and reveal technical synopses."
        items={DEFAULT_EDITORIAL_FIXTURES}
      />

      <section aria-labelledby="readiness-heading" className="mt-14 sm:mt-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-text-muted font-mono text-xs tracking-wide uppercase">
              Platform readiness
            </p>
            <h2
              id="readiness-heading"
              className="font-display text-text mt-1 text-2xl font-semibold"
            >
              Verified architecture foundations
            </h2>
          </div>
          <ButtonLink href="/legal/copyright" variant="ghost" size="sm">
            Read Copyright &amp; Rights Policy
          </ButtonLink>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          {FOUNDATION_MODULES.map((mod) => (
            <article key={mod.name} className="cg-surface flex flex-col justify-between p-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-text text-lg font-semibold">{mod.name}</h3>
                  <Badge tone={mod.tone}>{mod.state}</Badge>
                </div>
                <p className="text-text-secondary mt-3 text-sm leading-6">{mod.detail}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </ConsumerShell>
  );
}
