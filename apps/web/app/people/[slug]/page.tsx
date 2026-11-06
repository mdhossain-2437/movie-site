import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KeyArt } from "@/components/art/key-art";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Breadcrumbs, FixtureNotice, SectionHeading } from "@/components/catalogue/common";
import { PosterLink } from "@/components/experience/poster-link";
import { ShareButton } from "@/components/experience/actions";
import { Icon } from "@/components/ui/icon";
import { getPerson, personStaticParams, roleLabel } from "@/lib/catalogue/repository";
import { formatLifespan, formatRuntime, pad2, pluralize } from "@/lib/catalogue/format";
import type { CSSProperties } from "react";

export function generateStaticParams() {
  return personStaticParams();
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const person = getPerson(slug);
  return person
    ? {
        title: `${person.name} — Filmography`,
        description: person.bio ?? `Explore the work of ${person.name}.`,
      }
    : { title: "Person not found" };
}
export default async function PersonPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const person = getPerson(slug);
  if (!person) notFound();
  return (
    <ConsumerShell fullBleed>
      <section className="person-hero">
        <Breadcrumbs
          items={[
            { label: "Discover", href: "/" },
            { label: "People", href: "/people" },
            { label: person.name },
          ]}
        />
        <div className="person-heading-row">
          <p className="eyebrow">{person.roles.map(roleLabel).join(" / ")}</p>
          <h1>{person.name}</h1>
          <span className="eyebrow">{formatLifespan(person.born, person.died)}</span>
        </div>
        <div
          className="filmography-gallery"
          role="region"
          aria-label={`${person.name} filmography`}
          tabIndex={0}
          style={{ "--film-count": person.films.length } as CSSProperties}
        >
          {person.films.map((card, i) => (
            <PosterLink
              href={`/movies/${card.slug}`}
              title={card.title}
              color={card.art.palette.bg2}
              className={`filmography-link filmography-link-${i % 3}`}
              key={card.slug}
              label={`${card.title}, ${card.year}`}
            >
              <div className="filmography-art" data-poster-art>
                <KeyArt spec={card.art} />
                <div className="art-grain" />
                <div className="poster-scrim" />
                <span className="filmography-poster-title">{card.title}</span>
              </div>
              <div className="filmography-caption">
                <span>{pad2(i + 1)}</span>
                <span>{card.year}</span>
              </div>
            </PosterLink>
          ))}
        </div>
        <div
          className={`person-watermark ${person.displayName.length > 9 ? "person-watermark-long" : ""}`}
          aria-hidden="true"
        >
          {person.displayName}
        </div>
        <div className="person-hero-footer">
          <span>{pluralize(person.films.length, "film")} in this development archive</span>
          <a href="#biography">
            The person behind the films
            <Icon name="arrow" />
          </a>
        </div>
      </section>
      <div className="person-body">
        <section className="person-bio-section" id="biography">
          <div>
            <p className="eyebrow">A singular perspective</p>
            <h2>
              {person.name}
              <span>.</span>
            </h2>
            {person.nameBn ? (
              <p lang="bn" className="person-bangla">
                {person.nameBn}
              </p>
            ) : null}
            <ShareButton title={`${person.name} — Filmography`} path={`/people/${person.slug}`} />
          </div>
          <div>
            <p className="person-bio">
              {person.bio ?? "Biography is awaiting source verification."}
            </p>
            <dl className="person-facts">
              <div>
                <dt>Years</dt>
                <dd>{formatLifespan(person.born, person.died) ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt>Origin</dt>
                <dd>{person.origin ?? "Source verification pending"}</dd>
              </div>
              <div>
                <dt>Craft</dt>
                <dd>{person.roles.map(roleLabel).join(" · ")}</dd>
              </div>
            </dl>
          </div>
        </section>
        <FixtureNotice />
        <section className="complete-filmography">
          <SectionHeading
            eyebrow="Follow the work"
            title="In this archive."
            count={person.films.length}
          />
          <div className="person-film-list">
            {person.films.map((card, i) => (
              <Link href={`/movies/${card.slug}`} className="person-film-row" key={card.slug}>
                <span className="credit-number">{pad2(i + 1)}</span>
                <span className="person-film-year">{card.year}</span>
                <div>
                  <h3>{card.title}</h3>
                  <p>
                    {person.credits
                      .filter((credit) => credit.card.slug === card.slug)
                      .map(
                        (credit) =>
                          `${roleLabel(credit.department)}${credit.character ? ` · ${credit.character}` : ""}`,
                      )
                      .join(" / ")}
                  </p>
                </div>
                <span className="person-film-runtime">≈ {formatRuntime(card.runtimeMinutes)}</span>
                <Icon name="arrow-up-right" />
              </Link>
            ))}
          </div>
        </section>
        <Link href="/people" className="text-link">
          <Icon name="arrow-left" />
          More perspectives
        </Link>
      </div>
    </ConsumerShell>
  );
}
