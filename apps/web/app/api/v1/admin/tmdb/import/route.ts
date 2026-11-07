import { assertSameOriginRequest } from "@movie/auth";
import { getEnv } from "@movie/config";
import { createDraftTitle, getDatabase } from "@movie/db";
import { z } from "zod";
import { fetchTmdbWorkDetail } from "@/lib/metadata/tmdb-client";
import { TMDB_OFFICIAL_ATTRIBUTION } from "@/lib/metadata/tmdb-types";
import {
  extractRequestId,
  getCurrentSession,
  jsonNoStore,
  toProblemResponse,
} from "@/lib/server/api-helpers";

const ImportTmdbBodySchema = z.object({
  mediaKind: z.enum(["movie", "tv"]),
  tmdbId: z.number().int().positive(),
  licenseConfirmed: z.boolean().default(false),
});

function slugifyTmdbTitle(title: string, tmdbId: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "tmdb-entry"}-${tmdbId}`;
}

export async function POST(request: Request) {
  const requestId = extractRequestId(request);
  try {
    assertSameOriginRequest(request, getEnv().APP_URL);
    const body = ImportTmdbBodySchema.parse(await request.json());
    const { session } = await getCurrentSession();
    const db = await getDatabase();

    const detail = await fetchTmdbWorkDetail(body.mediaKind, body.tmdbId);
    const slug = slugifyTmdbTitle(detail.title, detail.tmdbId);
    const studioLabel = detail.studios[0]?.name;

    const created = await createDraftTitle(
      db,
      { actor: session?.actor ?? null, requestId },
      {
        slug,
        kind: detail.kind,
        originalTitle: detail.originalTitle.slice(0, 200),
        originalLanguage: /^[a-z]{2,5}$/.test(detail.originalLanguage)
          ? detail.originalLanguage
          : "en",
        releaseYear: detail.releaseYear ?? new Date().getFullYear(),
        runtimeMinutes: Math.max(1, Math.min(1200, detail.runtimeMinutes ?? 90)),
        maturityRating: "UNRATED",
        isDevelopmentFixture: getEnv().NODE_ENV !== "production",
        translations: [
          {
            locale: "en",
            localizedTitle: detail.title.slice(0, 200),
            tagline: detail.tagline ? detail.tagline.slice(0, 240) : undefined,
            synopsis:
              detail.synopsis.length >= 10
                ? detail.synopsis.slice(0, 3900)
                : `${detail.title} — imported metadata record awaiting editorial synopsis.`,
          },
        ],
        genreSlugs: detail.genreLabels.map((g) =>
          g
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, ""),
        ),
        attribution: {
          provider: "TMDB",
          externalId: `tmdb:${body.mediaKind}:${detail.tmdbId}`,
          attributionText: studioLabel
            ? `${studioLabel} · ${TMDB_OFFICIAL_ATTRIBUTION}`
            : TMDB_OFFICIAL_ATTRIBUTION,
          licenseConfirmed: body.licenseConfirmed,
        },
      },
    );

    return jsonNoStore(
      {
        ...created,
        slug,
        status: "DRAFT",
        rightsNote:
          "Draft metadata imported from TMDB. Verified distribution rights and packaged media are required before publishing.",
      },
      201,
      requestId,
    );
  } catch (error) {
    return toProblemResponse(error, requestId);
  }
}
