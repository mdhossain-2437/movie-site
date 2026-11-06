import type { Metadata } from "next";
import Link from "next/link";
import { ConsumerShell } from "@/components/layout/site-shell";
import { EmptyArchive, FixtureNotice, SectionHeading } from "@/components/catalogue/common";
import { DirectorIndex } from "@/components/catalogue/editorial";
import { Icon } from "@/components/ui/icon";
import { listDirectors, listPeople, roleLabel } from "@/lib/catalogue/repository";
import { formatLifespan, pad2 } from "@/lib/catalogue/format";

export const metadata: Metadata = {
  title: "The people behind the frame",
  description:
    "Explore filmmakers, writers and performers through their work. A filmography-led view of cinema.",
};
export default function PeoplePage() {
  const directors = listDirectors();
  const people = listPeople().filter((person) => !person.roles.includes("DIRECTOR"));
  return (
    <ConsumerShell>
      <header className="page-header page-header-split">
        <div>
          <p className="eyebrow">The vision behind the frame</p>
          <h1>
            People<sup>{pad2(directors.length + people.length)}</sup>
          </h1>
        </div>
        <p>
          Every film starts with a point of view.
          <br />
          Meet the minds that changed the way we see.
        </p>
      </header>
      <FixtureNotice compact />
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
