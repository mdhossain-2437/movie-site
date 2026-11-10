import type { Metadata } from "next";
import Link from "next/link";
import { EmptyArchive, SectionHeading } from "@/components/catalogue/common";
import { DirectorIndex } from "@/components/catalogue/editorial";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Badge } from "@/components/ui";
import { Icon } from "@/components/ui/icon";
import { CINEVA_PEOPLE } from "@/lib/catalogue/cineva-database";
import { formatLifespan, pad2 } from "@/lib/catalogue/format";
import { listDirectors, listPeople, roleLabel } from "@/lib/catalogue/repository";

export const metadata: Metadata = {
  title: "Directors & Cast · CINEVA",
  description:
    "Explore contemporary Dhaka auteurs, lead performers, and world cinema pioneers through their complete filmographies.",
};

export default function PeoplePage() {
  const directors = listDirectors();
  const people = listPeople().filter((person) => !person.roles.includes("DIRECTOR"));
  const totalCount = CINEVA_PEOPLE.length + directors.length + people.length;

  return (
    <ConsumerShell>
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">The vision behind the frame</p>
          <h1>
            People<sup>{pad2(totalCount)}</sup>
          </h1>
        </div>
        <p>
          Every film starts with a point of view.
          <br />
          Meet the minds that changed the way we see.
        </p>
      </header>

      {/* Contemporary CINEVA Auteurs & Lead Performers */}
      <section aria-labelledby="contemporary-talent-heading" className="mb-16 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-accent font-mono text-xs font-semibold tracking-widest uppercase">
              CINEVA Originals &amp; Repertory
            </p>
            <h2
              id="contemporary-talent-heading"
              className="font-display text-text text-2xl font-bold sm:text-3xl"
            >
              Featured Directors &amp; Principal Cast
            </h2>
          </div>
          <Badge tone="accent">{CINEVA_PEOPLE.length} Active Profiles</Badge>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CINEVA_PEOPLE.map((person, index) => (
            <Link
              key={person.id}
              href={`/people/${person.slug}`}
              className="group border-border bg-surface-1 hover:border-accent/60 flex flex-col justify-between rounded-xl border p-5 transition-colors duration-200 motion-reduce:transition-none"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-accent font-mono text-xs font-bold">{pad2(index + 1)}</span>
                  <span className="border-border bg-surface-2 text-text-muted rounded-xs border px-2 py-0.5 font-mono text-[10px] uppercase">
                    {person.primaryRole}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-text group-hover:text-accent text-xl font-bold transition-colors motion-reduce:transition-none">
                    {person.nameEn}
                  </h3>
                </div>
                <p className="text-text-secondary line-clamp-3 text-xs leading-relaxed">
                  {person.bio}
                </p>
              </div>

              <div className="border-border mt-4 flex items-center justify-between border-t pt-3">
                <span className="text-text-muted font-mono text-[11px]">{person.origin}</span>
                <span className="text-accent font-mono text-xs font-semibold">Filmography →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {directors.length > 0 ? (
        <>
          <section className="people-directors">
            <SectionHeading
              eyebrow="An index of perspectives"
              title="The filmmakers."
              count={directors.length}
            />
            <DirectorIndex people={directors} />
          </section>
          {people.length > 0 ? (
            <section className="people-contributors">
              <SectionHeading
                eyebrow="In front of the lens. Behind the scenes."
                title="The collaborators."
                count={people.length}
              />
              <div className="people-grid">
                {people.map((person, i) => (
                  <Link
                    href={`/people/${person.slug}`}
                    className="person-index-card"
                    key={person.slug}
                  >
                    <span className="eyebrow">
                      {pad2(i + 1)} / {person.roles.map(roleLabel).join(" & ")}
                    </span>
                    <h3>{person.name}</h3>
                    <div>
                      <span>{formatLifespan(person.born, person.died)}</span>
                      <Icon name="arrow-up-right" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <EmptyArchive
          title="The people behind the next chapter."
          description="Filmographies will appear here when their source-verified catalogue records are ready for publication."
        />
      )}
    </ConsumerShell>
  );
}
