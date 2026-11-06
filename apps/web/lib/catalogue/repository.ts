import "server-only";

import type { DeliveryAction, MaturityRating, TitleStatus } from "@movie/contracts";
import type { RightsDecision } from "@movie/domain";
import {
  deriveAvailability,
  describeAuthorizationFacts,
  evaluateDisplayActions,
  evaluateTitleAction,
  type ActionAvailability,
  type AuthorizationFact,
  type EvaluationScope,
} from "./availability";
import {
  FIXTURE_COLLECTIONS,
  FIXTURE_FEATURED,
  FIXTURE_PEOPLE,
  FIXTURE_SNAPSHOT_AT,
  FIXTURE_TITLES,
} from "./fixtures";
import { decadeOf, joinNames, pluralize, slugify } from "./format";
import { searchEntries, type SearchEntry, type SearchHit } from "./search";
import { isFixtureCatalogueEnabled, resolveViewerTerritory } from "./stage";
import type {
  CatalogueCollection,
  CataloguePerson,
  CatalogueTitle,
  CreditDepartment,
  FixtureCredit,
  PersonRef,
  ResolvedCredit,
  TitleCard,
} from "./types";

/**
 * Catalogue read model. Development and test builds read the development fixtures; staging and
 * production read an empty catalogue until the database-backed, rights-approved catalogue lands.
 */
interface CatalogueSource {
  titles: readonly CatalogueTitle[];
  people: readonly CataloguePerson[];
  collections: readonly CatalogueCollection[];
  featured: readonly string[];
}

const EMPTY_SOURCE: CatalogueSource = { titles: [], people: [], collections: [], featured: [] };

function source(): CatalogueSource {
  if (!isFixtureCatalogueEnabled()) return EMPTY_SOURCE;
  return {
    titles: FIXTURE_TITLES,
    people: FIXTURE_PEOPLE,
    collections: FIXTURE_COLLECTIONS,
    featured: FIXTURE_FEATURED,
  };
}

export type CatalogueMode = "fixtures" | "empty";

export function getCatalogueMode(): CatalogueMode {
  return isFixtureCatalogueEnabled() ? "fixtures" : "empty";
}

/** Catalogue display uses a fixed evaluation snapshot so listings stay static and cacheable. */
function displayScope(): EvaluationScope {
  return { at: FIXTURE_SNAPSHOT_AT, territory: resolveViewerTerritory() };
}

function byYearThenTitle(a: { year: number; title: string }, b: { year: number; title: string }) {
  return a.year - b.year || a.title.localeCompare(b.title);
}

function peopleBySlug(src: CatalogueSource): Map<string, CataloguePerson> {
  return new Map(src.people.map((person) => [person.slug, person]));
}

function resolveCredit(
  credit: FixtureCredit,
  people: Map<string, CataloguePerson>,
): ResolvedCredit {
  const person = credit.person ? people.get(credit.person) : undefined;
  return {
    department: credit.department,
    name: person?.name ?? credit.name ?? "Uncredited",
    personSlug: person?.slug ?? null,
    character: credit.character ?? null,
  };
}

function toCard(
  title: CatalogueTitle,
  people: Map<string, CataloguePerson>,
  scope: EvaluationScope,
): TitleCard {
  const directors: PersonRef[] = title.credits
    .filter((credit) => credit.department === "DIRECTOR")
    .map((credit) => {
      const resolved = resolveCredit(credit, people);
      return { slug: resolved.personSlug, name: resolved.name };
    });
  return {
    slug: title.slug,
    title: title.title,
    titleBn: title.titleBn,
    year: title.year,
    runtimeMinutes: title.runtimeMinutes,
    countries: title.countries,
    genres: title.genres,
    directors,
    art: title.art,
    availability: deriveAvailability(title, scope),
    synopsis: title.synopsis,
    synopsisBn: title.synopsisBn,
    studio: title.studio,
    isDevelopmentFixture: title.isDevelopmentFixture,
  };
}

function allCards(src: CatalogueSource): TitleCard[] {
  const people = peopleBySlug(src);
  const scope = displayScope();
  return [...src.titles].sort(byYearThenTitle).map((title) => toCard(title, people, scope));
}

/* ------------------------------------------------------------------ titles */

export function listTitles(): TitleCard[] {
  return allCards(source());
}

export function getFeaturedTitles(): TitleCard[] {
  const src = source();
  const cards = new Map(allCards(src).map((card) => [card.slug, card]));
  return src.featured.flatMap((slug) => {
    const card = cards.get(slug);
    return card ? [card] : [];
  });
}

export interface RightsSummary {
  claim: string;
  requestCount: number;
  pendingCount: number;
  approvedCount: number;
  evidenceCount: number;
  territories: string[];
  requestedActions: DeliveryAction[];
}

export interface TitleDetail {
  card: TitleCard;
  originalTitle: string;
  originalLanguage: string;
  soundFormat: string;
  maturityRating: MaturityRating;
  status: TitleStatus;
  directors: ResolvedCredit[];
  writers: ResolvedCredit[];
  cast: ResolvedCredit[];
  actions: ActionAvailability[];
  rights: RightsSummary;
  collections: { slug: string; title: string }[];
  moreFromDirectors: TitleCard[];
  related: TitleCard[];
  territory: string;
  evaluatedAt: string;
}

const RIGHTS_CLAIM_LABEL: Readonly<Record<CatalogueTitle["rightsClaim"], string>> = {
  PUBLIC_DOMAIN_CLAIM_UNVERIFIED: "Public-domain claim · legal review pending",
};

function findTitle(src: CatalogueSource, slug: string): CatalogueTitle | undefined {
  return src.titles.find((title) => title.slug === slug);
}

export function getTitle(slug: string): TitleDetail | null {
  const src = source();
  const title = findTitle(src, slug);
  if (!title) return null;

  const people = peopleBySlug(src);
  const scope = displayScope();
  const credits = title.credits.map((credit) => resolveCredit(credit, people));
  const ofDepartment = (department: CreditDepartment) =>
    credits.filter((credit) => credit.department === department);

  const directorSlugs = new Set(
    title.credits.filter((c) => c.department === "DIRECTOR" && c.person).map((c) => c.person),
  );
  const others = src.titles.filter((candidate) => candidate.slug !== title.slug);
  const moreFromDirectors = others
    .filter((candidate) =>
      candidate.credits.some((c) => c.department === "DIRECTOR" && directorSlugs.has(c.person)),
    )
    .sort(byYearThenTitle);
  const moreSlugs = new Set(moreFromDirectors.map((candidate) => candidate.slug));
  const related = others
    .filter((candidate) => !moreSlugs.has(candidate.slug))
    .map((candidate) => ({
      candidate,
      shared: candidate.genres.filter((genre) => title.genres.includes(genre)).length,
    }))
    .filter(({ shared }) => shared > 0)
    .sort(
      (a, b) =>
        b.shared - a.shared ||
        Math.abs(a.candidate.year - title.year) - Math.abs(b.candidate.year - title.year) ||
        a.candidate.title.localeCompare(b.candidate.title),
    )
    .slice(0, 8)
    .map(({ candidate }) => candidate);

  return {
    card: toCard(title, people, scope),
    originalTitle: title.originalTitle,
    originalLanguage: title.originalLanguage,
    soundFormat: title.soundFormat,
    maturityRating: title.maturityRating,
    status: title.status,
    directors: ofDepartment("DIRECTOR"),
    writers: ofDepartment("WRITER"),
    cast: ofDepartment("ACTOR"),
    actions: evaluateDisplayActions(title, scope),
    rights: {
      claim: RIGHTS_CLAIM_LABEL[title.rightsClaim],
      requestCount: title.grants.length,
      pendingCount: title.grants.filter((grant) => grant.status === "PENDING").length,
      approvedCount: title.grants.filter((grant) => grant.status === "APPROVED").length,
      evidenceCount: title.grants.reduce((sum, grant) => sum + grant.evidence.length, 0),
      territories: [...new Set(title.grants.flatMap((grant) => grant.allowedTerritories))],
      requestedActions: [...new Set(title.grants.flatMap((grant) => grant.allowedActions))],
    },
    collections: src.collections
      .filter((collection) => collection.items.includes(title.slug))
      .map((collection) => ({ slug: collection.slug, title: collection.title })),
    moreFromDirectors: moreFromDirectors.map((candidate) => toCard(candidate, people, scope)),
    related: related.map((candidate) => toCard(candidate, people, scope)),
    territory: scope.territory,
    evaluatedAt: scope.at.toISOString(),
  };
}

export interface PlaybackAuthorization {
  card: TitleCard;
  stream: RightsDecision;
  download: RightsDecision;
  facts: AuthorizationFact[];
  territory: string;
  evaluatedAt: string;
}

/** Request-time authorization for the watch route. Callers pass the current instant. */
export function authorizePlayback(slug: string, at: Date): PlaybackAuthorization | null {
  const src = source();
  const title = findTitle(src, slug);
  if (!title) return null;
  const territory = resolveViewerTerritory();
  const scope = { at, territory };
  return {
    card: toCard(title, peopleBySlug(src), displayScope()),
    stream: evaluateTitleAction(title, "STREAM", scope),
    download: evaluateTitleAction(title, "DOWNLOAD", scope),
    facts: describeAuthorizationFacts(title, territory),
    territory,
    evaluatedAt: at.toISOString(),
  };
}

/* ------------------------------------------------------------------ people */

export interface PersonCredit {
  department: CreditDepartment;
  character: string | null;
  card: TitleCard;
}

export interface PersonSummary {
  slug: string;
  name: string;
  nameBn: string | null;
  displayName: string;
  born: number | null;
  died: number | null;
  origin: string | null;
  roles: CreditDepartment[];
  films: TitleCard[];
}

export interface PersonDetail extends PersonSummary {
  bio: string | null;
  credits: PersonCredit[];
}

const ROLE_ORDER: readonly CreditDepartment[] = ["DIRECTOR", "WRITER", "ACTOR"];

function creditsFor(src: CatalogueSource, slug: string, cards: Map<string, TitleCard>) {
  const credits: PersonCredit[] = [];
  for (const title of [...src.titles].sort(byYearThenTitle)) {
    const card = cards.get(title.slug);
    if (!card) continue;
    for (const credit of title.credits) {
      if (credit.person === slug) {
        credits.push({ department: credit.department, character: credit.character ?? null, card });
      }
    }
  }
  return credits;
}

function summarize(person: CataloguePerson, credits: PersonCredit[]): PersonSummary {
  const films = new Map<string, TitleCard>();
  for (const credit of credits) films.set(credit.card.slug, credit.card);
  const roles = ROLE_ORDER.filter((role) => credits.some((credit) => credit.department === role));
  return {
    slug: person.slug,
    name: person.name,
    nameBn: person.nameBn,
    displayName: person.displayName,
    born: person.born,
    died: person.died,
    origin: person.origin,
    roles,
    films: [...films.values()],
  };
}

export function listPeople(): PersonSummary[] {
  const src = source();
  const cards = new Map(allCards(src).map((card) => [card.slug, card]));
  return src.people
    .map((person) => summarize(person, creditsFor(src, person.slug, cards)))
    .filter((person) => person.films.length > 0)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

/** Directors in order of their earliest film in the catalogue. */
export function listDirectors(): PersonSummary[] {
  const src = source();
  const cards = new Map(allCards(src).map((card) => [card.slug, card]));
  return src.people
    .map((person) => {
      const directed = creditsFor(src, person.slug, cards).filter(
        (credit) => credit.department === "DIRECTOR",
      );
      return { ...summarize(person, directed), roles: ["DIRECTOR" as const] };
    })
    .filter((person) => person.films.length > 0)
    .sort(
      (a, b) =>
        (a.films[0]?.year ?? 0) - (b.films[0]?.year ?? 0) ||
        a.displayName.localeCompare(b.displayName),
    );
}

export function getPerson(slug: string): PersonDetail | null {
  const src = source();
  const person = src.people.find((candidate) => candidate.slug === slug);
  if (!person) return null;
  const cards = new Map(allCards(src).map((card) => [card.slug, card]));
  const credits = creditsFor(src, slug, cards);
  return { ...summarize(person, credits), bio: person.bio, credits };
}

export function roleLabel(role: CreditDepartment): string {
  return role === "DIRECTOR" ? "Director" : role === "WRITER" ? "Writer" : "Performer";
}

/* ------------------------------------------------------------- collections */

export interface CollectionSummary {
  slug: string;
  title: string;
  titleBn: string;
  description: string;
  titles: TitleCard[];
}

function collectionSummaries(src: CatalogueSource): CollectionSummary[] {
  const cards = new Map(allCards(src).map((card) => [card.slug, card]));
  return src.collections.map((collection) => ({
    slug: collection.slug,
    title: collection.title,
    titleBn: collection.titleBn,
    description: collection.description,
    titles: collection.items.flatMap((slug) => {
      const card = cards.get(slug);
      return card ? [card] : [];
    }),
  }));
}

export function listCollections(): CollectionSummary[] {
  return collectionSummaries(source());
}

export function getCollection(slug: string): CollectionSummary | null {
  return collectionSummaries(source()).find((collection) => collection.slug === slug) ?? null;
}

/* ------------------------------------------------------------------ facets */

export interface Facet {
  slug: string;
  label: string;
  count: number;
}

function facetOf(values: string[], toSlug: (value: string) => string): Facet[] {
  const counts = new Map<string, Facet>();
  for (const value of values) {
    const slug = toSlug(value);
    const existing = counts.get(slug);
    if (existing) existing.count += 1;
    else counts.set(slug, { slug, label: value, count: 1 });
  }
  return [...counts.values()];
}

export interface BrowseFacets {
  genres: Facet[];
  decades: Facet[];
  countries: Facet[];
}

export function getBrowseFacets(): BrowseFacets {
  const titles = source().titles;
  return {
    genres: facetOf(
      titles.flatMap((title) => [...title.genres]),
      slugify,
    ).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
    decades: facetOf(
      titles.map((title) => decadeOf(title.year)),
      (value) => value,
    ).sort((a, b) => a.slug.localeCompare(b.slug)),
    countries: facetOf(
      titles.flatMap((title) => [...title.countries]),
      slugify,
    ).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}

export function listGenres(): Facet[] {
  return getBrowseFacets().genres;
}

export function getGenre(slug: string): { genre: Facet; titles: TitleCard[] } | null {
  const genre = listGenres().find((facet) => facet.slug === slug);
  if (!genre) return null;
  return {
    genre,
    titles: listTitles().filter((card) => card.genres.some((name) => slugify(name) === slug)),
  };
}

/* ------------------------------------------------------------------ browse */

export type BrowseSort = "year" | "year-desc" | "title";
export type BrowseView = "grid" | "index";

export interface BrowseFilters {
  genre: string | null;
  decade: string | null;
  country: string | null;
  sort: BrowseSort;
  view: BrowseView;
}

type RawParams = Record<string, string | string[] | undefined>;

function firstParam(params: RawParams, key: string): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

/** Accepts only known facet values so arbitrary input is never echoed back into the page. */
export function parseBrowseFilters(params: RawParams): BrowseFilters {
  const facets = getBrowseFacets();
  const pick = (key: string, options: Facet[]) => {
    const value = firstParam(params, key);
    return value && options.some((facet) => facet.slug === value) ? value : null;
  };
  const sort = firstParam(params, "sort");
  return {
    genre: pick("genre", facets.genres),
    decade: pick("decade", facets.decades),
    country: pick("country", facets.countries),
    sort: sort === "year-desc" || sort === "title" ? sort : "year",
    view: firstParam(params, "view") === "index" ? "index" : "grid",
  };
}

export function browseTitles(filters: BrowseFilters): TitleCard[] {
  const matches = listTitles().filter(
    (card) =>
      (!filters.genre || card.genres.some((genre) => slugify(genre) === filters.genre)) &&
      (!filters.decade || decadeOf(card.year) === filters.decade) &&
      (!filters.country || card.countries.some((country) => slugify(country) === filters.country)),
  );
  if (filters.sort === "year-desc") return matches.sort((a, b) => b.year - a.year);
  if (filters.sort === "title") return matches.sort((a, b) => a.title.localeCompare(b.title));
  return matches;
}

/* ------------------------------------------------------------------ search */

/** Client-safe search index: public metadata and generated-art specs only. */
export function getSearchIndex(): SearchEntry[] {
  const src = source();
  const people = peopleBySlug(src);
  const cards = allCards(src);
  const cardBySlug = new Map(cards.map((card) => [card.slug, card]));

  const titles: SearchEntry[] = [...src.titles].sort(byYearThenTitle).map((title) => {
    const credits = title.credits.map((credit) => resolveCredit(credit, people));
    const directors = credits.filter((credit) => credit.department === "DIRECTOR");
    return {
      kind: "title",
      slug: title.slug,
      href: `/movies/${title.slug}`,
      label: title.title,
      labelBn: title.titleBn,
      sublabel: `${title.year} · ${joinNames(directors.map((credit) => credit.name))}`,
      keywords: [
        title.originalTitle,
        title.originalLanguage,
        title.year,
        title.studio,
        ...title.countries,
        ...title.genres,
        ...credits.map((credit) => credit.name),
      ].join(" "),
      art: title.art,
      year: title.year,
    };
  });

  const peopleEntries: SearchEntry[] = listPeople().map((person) => ({
    kind: "person",
    slug: person.slug,
    href: `/people/${person.slug}`,
    label: person.name,
    labelBn: person.nameBn,
    sublabel: `${person.roles.map(roleLabel).join(" · ")} · ${pluralize(person.films.length, "film")}`,
    keywords: [
      person.displayName,
      person.origin ?? "",
      ...person.films.map((film) => film.title),
    ].join(" "),
    art: person.films[0]?.art ?? null,
    year: person.born,
  }));

  const collections: SearchEntry[] = src.collections.map((collection) => ({
    kind: "collection",
    slug: collection.slug,
    href: `/collections/${collection.slug}`,
    label: collection.title,
    labelBn: collection.titleBn,
    sublabel: `Collection · ${pluralize(collection.items.length, "film")}`,
    keywords: collection.items.map((slug) => cardBySlug.get(slug)?.title ?? "").join(" "),
    art: cardBySlug.get(collection.items[0] ?? "")?.art ?? null,
    year: null,
  }));

  return [...titles, ...peopleEntries, ...collections];
}

export interface CatalogueSearchResult {
  query: string;
  titles: TitleCard[];
  people: SearchHit[];
  collections: SearchHit[];
  total: number;
}

export function searchCatalogue(query: string): CatalogueSearchResult {
  const hits = searchEntries(getSearchIndex(), query, 60);
  const cards = new Map(listTitles().map((card) => [card.slug, card]));
  const titles = hits.flatMap((hit) => {
    if (hit.entry.kind !== "title") return [];
    const card = cards.get(hit.entry.slug);
    return card ? [card] : [];
  });
  const people = hits.filter((hit) => hit.entry.kind === "person");
  const collections = hits.filter((hit) => hit.entry.kind === "collection");
  return { query, titles, people, collections, total: hits.length };
}

/* -------------------------------------------------------------- operations */

export interface RightsQueueRow {
  slug: string;
  title: string;
  year: number;
  status: TitleStatus;
  grantStatus: string;
  territories: string[];
  requestedActions: DeliveryAction[];
  evidenceCount: number;
  decision: RightsDecision;
}

export interface OperationsSnapshot {
  mode: CatalogueMode;
  titleCount: number;
  publishedCount: number;
  peopleCount: number;
  collectionCount: number;
  pendingRequests: number;
  approvedGrants: number;
  evidenceDocuments: number;
  territory: string;
  evaluatedAt: string;
  queue: RightsQueueRow[];
}

export function getOperationsSnapshot(): OperationsSnapshot {
  const src = source();
  const scope = displayScope();
  const grants = src.titles.flatMap((title) => title.grants);
  return {
    mode: getCatalogueMode(),
    titleCount: src.titles.length,
    publishedCount: src.titles.filter((title) => title.status === "PUBLISHED").length,
    peopleCount: src.people.length,
    collectionCount: src.collections.length,
    pendingRequests: grants.filter((grant) => grant.status === "PENDING").length,
    approvedGrants: grants.filter((grant) => grant.status === "APPROVED").length,
    evidenceDocuments: grants.reduce((sum, grant) => sum + grant.evidence.length, 0),
    territory: scope.territory,
    evaluatedAt: scope.at.toISOString(),
    queue: [...src.titles].sort(byYearThenTitle).map((title) => ({
      slug: title.slug,
      title: title.title,
      year: title.year,
      status: title.status,
      grantStatus: [...new Set(title.grants.map((grant) => grant.status))].join(", ") || "NONE",
      territories: [...new Set(title.grants.flatMap((grant) => grant.allowedTerritories))],
      requestedActions: [...new Set(title.grants.flatMap((grant) => grant.allowedActions))],
      evidenceCount: title.grants.reduce((sum, grant) => sum + grant.evidence.length, 0),
      decision: evaluateTitleAction(title, "STREAM", scope),
    })),
  };
}

/* ------------------------------------------------------------ static params */

/**
 * Cache Components requires at least one param per dynamic route. When the catalogue is empty,
 * a placeholder is prerendered and resolves to `notFound()` because no record matches it.
 */
export const EMPTY_CATALOGUE_PARAM = "__catalogue-empty__";

function slugParams(slugs: string[]): { slug: string }[] {
  const unique = [...new Set(slugs)];
  return unique.length > 0 ? unique.map((slug) => ({ slug })) : [{ slug: EMPTY_CATALOGUE_PARAM }];
}

export function titleStaticParams() {
  return slugParams(source().titles.map((title) => title.slug));
}

export function personStaticParams() {
  return slugParams(listPeople().map((person) => person.slug));
}

export function collectionStaticParams() {
  return slugParams(source().collections.map((collection) => collection.slug));
}

export function genreStaticParams() {
  return slugParams(listGenres().map((genre) => genre.slug));
}
