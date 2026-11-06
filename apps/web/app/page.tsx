import type { Metadata } from "next";
import { TitleRail } from "@/components/catalogue/editorial";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { ConsumerShell } from "@/components/layout/site-shell";
import { ButtonLink } from "@/components/ui";
import { listTitles } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "CINEVA · Cinema & Streaming",
  description:
    "Stream acclaimed world cinema, restored classics, and original features in high definition on CINEVA.",
};

const FEATURED_CINEMA_SELECTION: FilmStripItem[] = [
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
  },
];

export default function Home() {
  const archiveReferences = listTitles().slice(0, 10);

  return (
    <ConsumerShell fullBleed>
      {/* Signature 7-Strip Monochrome Cinema Showcase Stage */}
      <FilmStripShowcase
        breadcrumbTitle="Featured Cinema"
        breadcrumbCategory="Films"
        watermarkText="Cineva"
        renderBreadcrumbAsH1
        items={FEATURED_CINEMA_SELECTION}
      />

      {/* Below-the-Fold Curated Discovery & Cinema Collections */}
      <div className="cg-container space-y-16 py-14 sm:py-20">
        {archiveReferences.length > 0 ? (
          <div className="max-w-full overflow-x-clip">
            <TitleRail
              cards={archiveReferences}
              eyebrow="Restored Classics & Milestones"
              title="From the archive."
              href="/movies"
              linkLabel="Explore all films"
            />
          </div>
        ) : null}

        <section
          aria-labelledby="curated-seasons-heading"
          className="border-border bg-surface-1 flex flex-col justify-between gap-8 rounded-xl border p-8 sm:flex-row sm:items-center sm:p-12"
        >
          <div className="max-w-xl space-y-2">
            <p className="text-accent font-mono text-xs tracking-widest uppercase">
              CINEVA Curated Seasons
            </p>
            <h2
              id="curated-seasons-heading"
              className="font-display text-text text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Explore Auteur Retrospectives &amp; World Cinema
            </h2>
            <p className="text-text-secondary text-sm leading-relaxed sm:text-base">
              Hand-picked filmographies, restored classics, and contemporary festival selections
              available to stream in crisp high definition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="/movies" variant="primary" size="lg">
              Browse Catalogue
            </ButtonLink>
            <ButtonLink href="/collections" variant="secondary" size="lg">
              Curated Collections
            </ButtonLink>
            <ButtonLink href="/people" variant="outline" size="lg">
              Directors &amp; Cast
            </ButtonLink>
          </div>
        </section>
      </div>
    </ConsumerShell>
  );
}
