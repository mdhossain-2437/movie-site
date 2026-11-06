"use client";

import Link from "next/link";
import { AvailabilityBadge } from "@/components/ui";

export interface FilmStripItem {
  id: string;
  slug: string;
  titleEn: string;
  titleBn?: string | null;
  releaseYear: number;
  runtimeMinutes?: number;
  maturityRating?: string;
  synopsisEn?: string;
  badgeKind?:
    | "stream_allowed"
    | "download_allowed"
    | "catalogue_only"
    | "region_restricted"
    | "rights_pending";
  isDevelopmentFixture?: boolean;
}

export interface FilmStripShowcaseProps {
  breadcrumbTitle: string;
  breadcrumbCategory?: string;
  watermarkText: string;
  heading?: string;
  subheading?: string;
  renderBreadcrumbAsH1?: boolean;
  items: FilmStripItem[];
}

const POSTER_BILLING: readonly [string, string][] = [
  ["AMINA RAHMAN", "TARIQ ANAM"],
  ["NUSRAT IMROSE", "CHANCHAL"],
  ["MOSHARRAF", "JAYA AHSAN"],
  ["FAZLE RABBI", "SHAMOL MAWLA"],
  ["AUPEE KARIM", "INTEKHAB"],
  ["RAFIATH RASHID", "FS NAYEEM"],
  ["DILARA ZAMAN", "AFZAL HOSSAIN"],
];

/**
 * High-contrast silver-halide chiaroscuro cinema poster illustrations.
 * Resting state mirrors iconic 35mm monochrome gallery posters on pure #000000 black;
 * hover/focus blooms with incandescent Cinema Crimson (#E50914 / #FF2A34).
 */
function CinemaPosterArt({
  index,
  title,
  releaseYear,
}: {
  index: number;
  title: string;
  releaseYear: number;
}) {
  const variant = index % 7;
  const [leadA, leadB] = POSTER_BILLING[variant] ?? ["ORIGINAL", "FEATURE"];
  const uid = `poster-${index}-${variant}`;
  const shortTitle = title.toUpperCase();

  return (
    <div className="bg-canvas relative h-full w-full overflow-hidden">
      <svg
        aria-hidden="true"
        viewBox="0 0 220 480"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full object-cover transition-transform duration-500 ease-out group-focus-within:scale-[1.04] group-hover:scale-[1.04] motion-reduce:transform-none"
      >
        <defs>
          <linearGradient id={`${uid}-sky-mid`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6c6c6c" />
            <stop offset="45%" stopColor="#9e9e9e" />
            <stop offset="78%" stopColor="#2a2a2a" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <linearGradient id={`${uid}-sky-bright`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dedede" />
            <stop offset="52%" stopColor="#b8b8b8" />
            <stop offset="85%" stopColor="#262626" />
            <stop offset="100%" stopColor="#080808" />
          </linearGradient>
          <linearGradient id={`${uid}-noir`} x1="0" y1="0" x2="1" y2="0.2">
            <stop offset="0%" stopColor="#020202" />
            <stop offset="52%" stopColor="#0c0c0c" />
            <stop offset="82%" stopColor="#585858" />
            <stop offset="100%" stopColor="#bcbcbc" />
          </linearGradient>
          <linearGradient id={`${uid}-monolith`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4c4c4c" />
            <stop offset="35%" stopColor="#1b1b1b" />
            <stop offset="100%" stopColor="#050505" />
          </linearGradient>
          <radialGradient id={`${uid}-rim`} cx="50%" cy="34%" r="55%">
            <stop offset="0%" stopColor="#e5e5e5" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#545454" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#050505" stopOpacity="0.98" />
          </radialGradient>
          <linearGradient id={`${uid}-bottom-scrim`} x1="0" y1="0.55" x2="0" y2="1">
            <stop offset="0%" stopColor="#000000" stopOpacity="0" />
            <stop offset="65%" stopColor="#000000" stopOpacity="0.72" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.96" />
          </linearGradient>
        </defs>

        {/* Variant 0: Hovering Obsidian Monolith in Mist */}
        {variant === 0 && (
          <g>
            <rect width="220" height="480" fill={`url(#${uid}-sky-mid)`} />
            <ellipse cx="110" cy="330" rx="130" ry="38" fill="#d4d4d4" opacity="0.35" />
            {/* Giant suspended dark ovoid monolith */}
            <ellipse
              cx="116"
              cy="205"
              rx="42"
              ry="132"
              transform="rotate(4 116 205)"
              fill={`url(#${uid}-monolith)`}
            />
            <path
              d="M92 86 C74 150, 74 260, 98 330"
              stroke="#d8d8d8"
              strokeWidth="1.6"
              fill="none"
              opacity="0.55"
            />
            {/* Horizon land & lone figure */}
            <path d="M0 372 Q65 364 130 370 T220 368 L220 480 L0 480 Z" fill="#0d0d0d" />
            <rect x="64" y="354" width="3" height="15" fill="#050505" />
            <circle cx="65.5" cy="352" r="2" fill="#050505" />
            <text
              x="110"
              y="224"
              textAnchor="middle"
              fill="#e5e5e5"
              fontSize="6"
              letterSpacing="2.1"
              opacity="0.82"
            >
              EVERY TIDE REMEMBERS
            </text>
          </g>
        )}

        {/* Variant 1: Dual Chiaroscuro Profiles & Subterranean Vortex */}
        {variant === 1 && (
          <g>
            <rect width="220" height="480" fill="#0b0b0b" />
            <rect width="220" height="340" fill={`url(#${uid}-rim)`} />
            {/* Left & Right opposing dramatic bust silhouettes */}
            <path
              d="M12 225 C18 165, 34 148, 52 145 C50 128, 58 106, 78 106 C98 106, 106 126, 102 148 C112 162, 118 192, 116 235 Z"
              fill="#141414"
              stroke="#9a9a9a"
              strokeWidth="0.8"
            />
            <path
              d="M124 235 C126 186, 136 164, 150 154 C146 132, 156 112, 176 114 C194 116, 202 136, 196 156 C206 170, 212 198, 214 235 Z"
              fill="#1b1b1b"
              stroke="#bcbcbc"
              strokeWidth="0.8"
            />
            {/* Giant acoustic vortex ring in mist */}
            <circle cx="110" cy="318" r="64" fill="#070707" stroke="#8f8f8f" strokeWidth="3" />
            <circle
              cx="110"
              cy="318"
              r="46"
              fill="#020202"
              stroke="#525252"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
            <ellipse cx="110" cy="372" rx="115" ry="34" fill="#cfcfcf" opacity="0.45" />
          </g>
        )}

        {/* Variant 2: Towering Silhouette & Wind-Swept Horizon */}
        {variant === 2 && (
          <g>
            <rect width="220" height="480" fill="#121212" />
            <rect width="220" height="390" fill={`url(#${uid}-sky-bright)`} opacity="0.88" />
            {/* Monumental upper portrait silhouette */}
            <path
              d="M28 245 C36 178, 62 152, 86 144 C80 116, 94 84, 124 84 C154 84, 168 114, 158 144 C180 156, 198 188, 204 245 Z"
              fill="#171717"
            />
            <path
              d="M124 84 C154 84, 168 114, 158 144"
              stroke="#f2f2f2"
              strokeWidth="2"
              fill="none"
            />
            {/* Hooded figure in silver mist */}
            <path
              d="M58 340 C72 268, 92 246, 110 246 C128 246, 148 268, 162 340 Z"
              fill="#2c2c2c"
            />
            <ellipse cx="110" cy="274" rx="14" ry="18" fill="#0d0d0d" />
            {/* Sweeping river dunes */}
            <path d="M0 356 Q95 330 220 364 L220 480 L0 480 Z" fill="#dcdcdc" opacity="0.7" />
            <path d="M0 392 Q120 368 220 398 L220 480 L0 480 Z" fill="#141414" />
          </g>
        )}

        {/* Variant 3: Stark Half-Face Noir Chiaroscuro */}
        {variant === 3 && (
          <g>
            <rect width="220" height="480" fill={`url(#${uid}-noir)`} />
            {/* Left pitch-black shadow mass */}
            <rect width="108" height="480" fill="#030303" />
            {/* Dramatic low-key half-lit face emerging on right */}
            <path
              d="M108 72 C148 72, 186 108, 192 168 C196 206, 184 248, 174 278 C164 306, 142 326, 108 330 Z"
              fill="#787878"
              opacity="0.55"
            />
            <path d="M148 168 Q168 162 182 170 Q168 176 148 172 Z" fill="#ededed" opacity="0.85" />
            <circle cx="164" cy="170" r="3.5" fill="#090909" />
            <path
              d="M108 135 C135 142, 152 195, 145 232 C136 238, 124 238, 114 234"
              fill="#111111"
            />
            <path d="M90 330 L220 365 L220 480 L70 480 Z" fill="#070707" />
          </g>
        )}

        {/* Variant 4: High-Key Silver Sky & Architectural Silhouette */}
        {variant === 4 && (
          <g>
            <rect width="220" height="480" fill="#dadada" />
            {/* Collegiate skyline rising from silhouetted scholar profile */}
            <rect x="44" y="156" width="14" height="58" fill="#1b1b1b" />
            <rect x="64" y="138" width="22" height="76" fill="#2c2c2c" />
            <rect x="92" y="122" width="18" height="92" fill="#141414" />
            <rect x="116" y="146" width="24" height="68" fill="#363636" />
            <rect x="146" y="162" width="16" height="52" fill="#1f1f1f" />
            {/* Spidery radio tower arch */}
            <path
              d="M128 146 L138 108 L148 146 M120 128 L156 120"
              stroke="#1a1a1a"
              strokeWidth="1.3"
              fill="none"
            />
            {/* Bold dark profile silhouette at lower right */}
            <path
              d="M68 214 L172 214 C188 238, 196 276, 190 326 C186 365, 198 415, 220 450 L220 480 L96 480 C92 432, 72 412, 58 382 C46 356, 54 328, 42 308 C34 294, 48 272, 52 250 C54 232, 60 220, 68 214 Z"
              fill="#0e0e0e"
            />
          </g>
        )}

        {/* Variant 5: Diagonal Split Sci-Fi Horizon */}
        {variant === 5 && (
          <g>
            <rect width="220" height="480" fill="#0a0a0a" />
            <polygon points="0,0 116,0 92,310 0,280" fill="#262626" />
            <polygon points="116,0 220,0 220,295 92,310" fill="#474747" />
            {/* Dual rim-lit navigator silhouettes */}
            <circle cx="58" cy="96" r="28" fill="#7c7c7c" />
            <path d="M12 245 C18 168, 38 136, 62 134 C86 136, 98 168, 102 245 Z" fill="#121212" />
            <circle cx="166" cy="88" r="32" fill="#969696" />
            <path
              d="M118 250 C124 166, 146 132, 174 132 C198 132, 214 168, 218 250 Z"
              fill="#191919"
            />
            {/* Diagonal light beam */}
            <line x1="114" y1="0" x2="90" y2="320" stroke="#e8e8e8" strokeWidth="2" opacity="0.6" />
          </g>
        )}

        {/* Variant 6: Sun-Bleached Silver Horizon & Twin Silhouettes */}
        {variant === 6 && (
          <g>
            <rect width="220" height="480" fill="#d4d4d4" />
            {/* Dramatic twin silhouettes upper left/right */}
            <path
              d="M0 250 L0 96 C18 82, 46 84, 58 112 C68 136, 62 166, 78 192 L92 250 Z"
              fill="#1c1c1c"
            />
            <path
              d="M220 255 L220 88 C196 72, 162 78, 148 108 C138 132, 142 162, 118 196 L102 255 Z"
              fill="#2a2a2a"
            />
            {/* Textured landscape horizon */}
            <rect x="0" y="248" width="220" height="232" fill="#8c8c8c" />
            <path d="M0 326 L220 312 L220 480 L0 480 Z" fill="#181818" />
            <rect x="16" y="424" width="188" height="20" fill="#e2e2e2" opacity="0.88" />
          </g>
        )}

        {/* Bottom Cinema Vignette */}
        <rect width="220" height="480" fill={`url(#${uid}-bottom-scrim)`} />

        {/* Poster Release Billing Line */}
        <text
          x="110"
          y="458"
          textAnchor="middle"
          fill="#a6a6a6"
          fontSize="6.2"
          fontWeight="600"
          letterSpacing="2"
        >
          CINEVA · {releaseYear}
        </text>
      </svg>

      {/* Crisp Unclipped Top Poster Billing Names */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-x-2.5 top-2.5 z-10 flex items-center justify-between gap-1 text-[6.5px] font-bold tracking-[0.12em] uppercase ${
          variant === 4 || variant === 6 ? "text-canvas/85" : "text-text/80"
        }`}
      >
        <span className="truncate">{leadA}</span>
        <span className="truncate text-right">{leadB}</span>
      </div>

      {/* Cinema Crimson Illumination Veil on Hover / Focus */}
      <div
        aria-hidden="true"
        className="from-ember/45 via-ember-glow/20 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent opacity-0 mix-blend-color transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      />
      <div
        aria-hidden="true"
        className="from-ember-deep/80 pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none"
      />

      {/* Sculptural Poster Title Overlay (Resting State) */}
      <div className="pointer-events-none absolute inset-x-3 bottom-7 z-10 text-center transition-opacity duration-300 group-focus-within:opacity-0 group-hover:opacity-0 motion-reduce:transition-none">
        <p className="font-display text-text line-clamp-2 text-sm leading-tight font-bold tracking-[0.16em] uppercase drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
          {shortTitle}
        </p>
      </div>
    </div>
  );
}

export function FilmStripShowcase({
  breadcrumbTitle,
  breadcrumbCategory = "Films",
  watermarkText,
  heading,
  subheading,
  renderBreadcrumbAsH1 = false,
  items,
}: FilmStripShowcaseProps) {
  const displayItems = items.slice(0, 7);

  return (
    <section
      aria-label={`${breadcrumbTitle} showcase stage`}
      className="bg-canvas relative flex min-h-[calc(100dvh-3.5rem)] w-full max-w-full flex-col justify-between overflow-hidden overflow-x-clip pt-4 pb-16 sm:pt-6 sm:pb-20"
    >
      {/* Centered Top Breadcrumb (Exact Image 1 Composition) */}
      <nav aria-label="Breadcrumb" className="relative z-10 mb-6 flex items-center justify-center">
        <ol className="text-text-muted flex flex-wrap items-center justify-center gap-2.5 text-xs">
          <li>
            <Link
              href="/"
              className="hover:text-text-secondary transition-colors motion-reduce:transition-none"
            >
              Main
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted/60">
            &gt;
          </li>
          <li>
            <Link
              href="/movies"
              className="hover:text-text-secondary transition-colors motion-reduce:transition-none"
            >
              {breadcrumbCategory}
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-muted/60">
            &gt;
          </li>
          <li>
            {renderBreadcrumbAsH1 ? (
              <h1 className="text-text text-xs font-medium">{breadcrumbTitle}</h1>
            ) : (
              <span className="text-text font-medium">{breadcrumbTitle}</span>
            )}
          </li>
        </ol>
      </nav>

      {/* Optional Heading (visually subtle when provided) */}
      {heading ? (
        <div className="sr-only">
          <h2>{heading}</h2>
          {subheading ? <p>{subheading}</p> : null}
        </div>
      ) : null}

      {/* 7 Tall Frameless Vertical Poster Strips Centered on Pitch Black */}
      <div className="relative z-10 mx-auto my-auto w-full max-w-[1180px] px-4 sm:px-6">
        <div className="flex snap-x snap-mandatory scrollbar-none gap-3 overflow-x-auto pb-4 sm:gap-3.5 lg:justify-center lg:overflow-visible lg:pb-0">
          {displayItems.map((item, index) => (
            <article
              key={item.id}
              className="group bg-surface-1 ease-standard focus-within:ring-accent hover:ring-accent/80 relative w-[185px] flex-none snap-center overflow-hidden rounded-[2px] transition-all duration-300 focus-within:z-20 focus-within:-translate-y-1.5 focus-within:ring-1 hover:z-20 hover:-translate-y-1.5 hover:shadow-[0_18px_44px_rgba(229,9,20,0.32)] hover:ring-1 motion-reduce:transform-none motion-reduce:transition-none sm:w-[205px] lg:w-auto lg:max-w-[162px] lg:flex-1"
            >
              <Link
                href={`/movies/${item.slug}`}
                className="flex h-[390px] w-full flex-col overflow-hidden focus:outline-none sm:h-[420px] lg:h-[435px] xl:h-[455px]"
                aria-label={`View film ${item.titleEn} (${item.releaseYear})`}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <CinemaPosterArt
                    index={index}
                    title={item.titleEn}
                    releaseYear={item.releaseYear}
                  />

                  {/* Hover / Focus Slide-up Story Reveal */}
                  <div className="border-border/80 bg-surface-1/95 ease-standard absolute inset-x-0 bottom-0 z-20 translate-y-full transform border-t p-3 opacity-0 backdrop-blur-md transition-all duration-300 group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 motion-reduce:transform-none motion-reduce:transition-none">
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span className="text-accent font-mono text-[10px] font-semibold">
                        {item.releaseYear}
                        {item.runtimeMinutes ? ` · ${item.runtimeMinutes}m` : ""}
                      </span>
                    </div>
                    <h3 className="font-display text-text text-xs leading-snug font-bold sm:text-sm">
                      {item.titleEn}
                    </h3>
                    {item.titleBn ? (
                      <p className="text-text-secondary font-display mt-0.5 text-[11px]" lang="bn">
                        {item.titleBn}
                      </p>
                    ) : null}
                    {item.synopsisEn ? (
                      <p className="text-text-secondary mt-1.5 line-clamp-3 text-[11px] leading-relaxed">
                        {item.synopsisEn}
                      </p>
                    ) : null}
                    {item.badgeKind ? (
                      <div className="mt-2 origin-left scale-90">
                        <AvailabilityBadge kind={item.badgeKind} />
                      </div>
                    ) : null}
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </div>

      {/* Giant Edge-to-Edge Lower Charcoal Watermark Typography (Exact Image 1 Treatment) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-3 z-0 w-full max-w-full overflow-hidden text-center select-none"
      >
        <span className="font-display text-text inline-block max-w-full text-[16vw] leading-[0.82] font-medium tracking-[-0.04em] whitespace-nowrap opacity-[0.13] select-none">
          {watermarkText}
        </span>
      </div>
    </section>
  );
}

export default FilmStripShowcase;
