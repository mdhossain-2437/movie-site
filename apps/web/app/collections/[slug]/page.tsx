import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/layout/site-shell";
import { KeyArt } from "@/components/art/key-art";
import { Breadcrumbs, FixtureNotice } from "@/components/catalogue/common";
import { PosterLink } from "@/components/experience/poster-link";
import { SaveButton, ShareButton } from "@/components/experience/actions";
import { Icon } from "@/components/ui/icon";
import { getCollection, collectionStaticParams } from "@/lib/catalogue/repository";
import { formatRuntime, joinNames, pad2, pluralize } from "@/lib/catalogue/format";

export function generateStaticParams() {
  return collectionStaticParams();
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);
  return collection
    ? { title: collection.title, description: collection.description }
    : { title: "Collection not found" };
}
export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const years = collection.titles.map((title) => title.year);
  return (
    <ConsumerShell fullBleed>
      <section className="collection-hero">
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/" },
            { label: "Collections", href: "/collections" },
            { label: collection.title },
          ]}
        />
        <div className="collection-hero-layout">
          <div className="collection-hero-copy">
            <p className="eyebrow">
              An editorial collection / {pluralize(collection.titles.length, "film")}
            </p>
            <h1>
              {collection.title}
              <span>.</span>
            </h1>
            <p lang="bn" className="collection-hero-bangla">
              {collection.titleBn}
            </p>
            <p className="collection-essay">{collection.description}</p>
            <div className="collection-hero-meta">
              <span>
                {Math.min(...years)} — {Math.max(...years)}
              </span>
              <a href="#collection-films" className="text-link">
                Explore the films
                <Icon name="arrow" />
              </a>
            </div>
            <ShareButton title={collection.title} path={`/collections/${slug}`} />
          </div>
          <div className="collection-hero-stack" aria-hidden="true">
            {collection.titles.slice(0, 3).map((card, i) => (
              <div
                className={`collection-stack-poster collection-stack-poster-${i}`}
                key={card.slug}
              >
                <KeyArt spec={card.art} />
                <div className="art-grain" />
              </div>
            ))}
          </div>
        </div>
      </section>
      <div className="collection-body" id="collection-films">
        <div className="collection-list-heading">
          <p className="eyebrow">The collection, frame by frame</p>
          <span>{pad2(collection.titles.length)} titles</span>
        </div>
        <FixtureNotice compact />
        {collection.titles.map((card, i) => (
          <article className="collection-film" key={card.slug}>
            <span className="collection-film-number">{pad2(i + 1)}</span>
            <PosterLink
              href={`/movies/${card.slug}`}
              title={card.title}
              color={card.art.palette.bg2}
              className="collection-film-art"
              label={`Explore ${card.title}`}
            >
              <div data-poster-art>
                <KeyArt spec={card.art} />
                <div className="art-grain" />
              </div>
            </PosterLink>
            <div className="collection-film-copy">
              <p className="eyebrow">
                {card.year} / {joinNames(card.directors.map((person) => person.name))}
              </p>
              <Link href={`/movies/${card.slug}`}>
                <h2>{card.title}</h2>
              </Link>
              <p>{card.synopsis}</p>
              <div className="collection-film-meta">
                <span>≈ {formatRuntime(card.runtimeMinutes)}</span>
                <span>{card.genres.join(" · ")}</span>
                <span>
                  <Icon name="lock" />
                  Rights pending
                </span>
              </div>
            </div>
            <div className="collection-film-actions">
              <Link
                href={`/movies/${card.slug}`}
                className="icon-button"
                aria-label={`Explore ${card.title}`}
              >
                <Icon name="arrow-up-right" />
              </Link>
              <SaveButton slug={card.slug} title={card.title} compact />
            </div>
          </article>
        ))}
        <Link href="/collections" className="text-link">
          <Icon name="arrow-left" />
          All collections
        </Link>
      </div>
    </ConsumerShell>
  );
}
