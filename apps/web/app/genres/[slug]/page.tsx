import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConsumerShell } from "@/components/layout/site-shell";
import { Breadcrumbs, FixtureNotice } from "@/components/catalogue/common";
import { PosterGrid } from "@/components/catalogue/poster-card";
import { getGenre, genreStaticParams } from "@/lib/catalogue/repository";
import { pad2 } from "@/lib/catalogue/format";
import { Icon } from "@/components/ui/icon";

export function generateStaticParams() {
  return genreStaticParams();
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = getGenre(slug);
  return { title: result ? `${result.genre.label} films` : "Genre not found" };
}
export default async function GenrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const result = getGenre(slug);
  if (!result) notFound();
  return (
    <ConsumerShell>
      <Breadcrumbs items={[{ label: "Films", href: "/movies" }, { label: result.genre.label }]} />
      <header className="page-header">
        <p className="eyebrow">A way into the archive</p>
        <h1>
          {result.genre.label}
          <sup>{pad2(result.titles.length)}</sup>
        </h1>
        <p>Different stories. A shared cinematic language.</p>
      </header>
      <FixtureNotice />
      <PosterGrid cards={result.titles} />
      <Link href="/movies" className="text-link mt-12">
        <Icon name="arrow-left" />
        Explore every genre
      </Link>
    </ConsumerShell>
  );
}
