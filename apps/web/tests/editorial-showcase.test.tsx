import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FilmStripShowcase, type FilmStripItem } from "@/components/catalogue/film-strip-showcase";
import { TitleHeroStage } from "@/components/catalogue/title-hero-stage";
import { FloatingDock } from "@/components/layout/floating-dock";
import { Button, Spinner } from "@/components/ui";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/movies/the-last-monsoon",
}));

afterEach(() => {
  cleanup();
});

describe("Spinner Primitive", () => {
  it("renders with role=status and accessible default sr-only copy", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "Loading…");
    expect(screen.getByText("Loading…")).toHaveClass("sr-only");
  });

  it("applies size classes and custom label", () => {
    render(<Spinner size="lg" label="Processing request" className="text-accent" />);
    const spinner = screen.getByRole("status");
    expect(spinner).toHaveClass("text-accent");
    expect(spinner).toHaveAttribute("aria-label", "Processing request");
    expect(screen.getByText("Processing request")).toBeInTheDocument();
  });
});

describe("Button Loading Integration", () => {
  it("renders Spinner when loading is true and sets aria-busy", () => {
    render(
      <Button loading variant="primary">
        Submit Order
      </Button>,
    );
    const button = screen.getByRole("button", { name: "Submit Order" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("span[aria-hidden='true']")).toBeInTheDocument();
  });
});

describe("Concept #1: FilmStripShowcase Stage", () => {
  const sampleItems: FilmStripItem[] = [
    {
      id: "f-1",
      slug: "the-last-monsoon",
      titleEn: "The Last Monsoon",
      titleBn: "শেষ বর্ষা",
      releaseYear: 2024,
      runtimeMinutes: 118,
      maturityRating: "PG13",
      synopsisEn: "Atmospheric noir across Old Dhaka waterways.",
      badgeKind: "stream_allowed",
    },
    {
      id: "f-2",
      slug: "neon-bhasha",
      titleEn: "Neon Bhasha",
      titleBn: "নিয়ন ভাষা",
      releaseYear: 2023,
      runtimeMinutes: 104,
      maturityRating: "PG13",
      synopsisEn: "Cybernetic acoustic mystery.",
      badgeKind: "stream_allowed",
    },
  ];

  it("renders centered breadcrumb navigation", () => {
    render(
      <FilmStripShowcase
        breadcrumbTitle="Amina Rahman"
        breadcrumbCategory="Directors"
        watermarkText="RAHMAN"
        items={sampleItems}
      />,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByText("Main")).toBeInTheDocument();
    expect(screen.getByText("Directors")).toBeInTheDocument();
    expect(screen.getByText("Amina Rahman")).toBeInTheDocument();
  });

  it("renders film items with links to movie detail routes", () => {
    render(
      <FilmStripShowcase
        breadcrumbTitle="Monsoon Archive"
        watermarkText="MONSOON"
        items={sampleItems}
      />,
    );
    const links = screen.getAllByRole("link", { name: /view film/i });
    expect(links.length).toBe(2);
    expect(links[0]).toHaveAttribute("href", "/movies/the-last-monsoon");
    expect(screen.getAllByText("The Last Monsoon").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("শেষ বর্ষা").length).toBeGreaterThanOrEqual(1);
  });

  it("renders subtle lower backdrop watermark display typography", () => {
    render(
      <FilmStripShowcase breadcrumbTitle="Vault" watermarkText="ARCHIVE" items={sampleItems} />,
    );
    expect(screen.getByText("ARCHIVE")).toBeInTheDocument();
  });
});

describe("Concept #2: TitleHeroStage Component", () => {
  const mockTitle = {
    id: "ttl_test_detail",
    slug: "the-last-monsoon",
    featureAssetId: "ast_feature_01",
    originalTitle: "The Last Monsoon",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 118,
    maturityRating: "PG13",
    isDevelopmentFixture: true,
    localizedTitleEn: "The Last Monsoon",
    localizedTitleBn: "শেষ বর্ষা",
    synopsisEn:
      "A rain-drenched neo-noir tracking an archivist uncovering coastal land syndicates in Old Dhaka.",
    synopsisBn: "পুরান ঢাকার নদী তীরের এক নব্য-নোয়ার চলচ্চিত্র।",
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "stream_allowed" as const,
    },
    genres: [
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: "আমিনা রহমান",
      },
      {
        department: "ACTOR",
        characterName: "Detective Chowdhury",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
    ],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Archival Vault",
      },
    ],
  };

  it("renders giant editorial title hierarchy and localized Bengali title", () => {
    render(
      <TitleHeroStage
        title={mockTitle}
        territoryCode="BD"
        isAuthenticated={true}
        initialSaved={false}
      />,
    );
    expect(screen.getByRole("heading", { level: 1, name: "The Last Monsoon" })).toBeInTheDocument();
    expect(screen.getByText("শেষ বর্ষা")).toBeInTheDocument();
  });

  it("renders circular translucent Play CTA linking to /watch/[slug]", () => {
    render(
      <TitleHeroStage
        title={mockTitle}
        territoryCode="BD"
        isAuthenticated={true}
        initialSaved={false}
      />,
    );
    const playLink = screen.getByRole("link", { name: /play stream for the last monsoon/i });
    expect(playLink).toHaveAttribute("href", "/watch/the-last-monsoon");
  });

  it("renders structured metadata pill rows for Country, Studio, Time, Date, Rate", () => {
    render(
      <TitleHeroStage
        title={mockTitle}
        territoryCode="BD"
        isAuthenticated={true}
        initialSaved={false}
      />,
    );
    expect(screen.getByText("Country:")).toBeInTheDocument();
    expect(screen.getByText("Studio:")).toBeInTheDocument();
    expect(screen.getByText("Time:")).toBeInTheDocument();
    expect(screen.getByText("Date:")).toBeInTheDocument();
    expect(screen.getByText("Rate:")).toBeInTheDocument();
    expect(screen.getByText("1h 58m")).toBeInTheDocument();
    expect(screen.getAllByText("2024").length).toBeGreaterThanOrEqual(1);
  });

  it("renders right-edge vertical floating quick action rail", () => {
    render(
      <TitleHeroStage
        title={mockTitle}
        territoryCode="BD"
        isAuthenticated={true}
        initialSaved={false}
      />,
    );
    const quickActions = screen.getByLabelText("Quick Actions");
    expect(quickActions).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Jump to Download Section" })).toHaveAttribute(
      "href",
      "#download-section",
    );
    expect(screen.getByRole("link", { name: "Scroll to Details" })).toHaveAttribute(
      "href",
      "#details",
    );
  });

  it("renders below-the-fold credits, details, and rights sections", () => {
    render(
      <TitleHeroStage
        title={mockTitle}
        territoryCode="BD"
        isAuthenticated={true}
        initialSaved={false}
      />,
    );
    expect(screen.getByRole("heading", { name: "Cast & Crew" })).toBeInTheDocument();
    expect(screen.getAllByText("Amina Rahman").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("as Detective Chowdhury")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Technical & Release Details" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Source & Legal Rights Attribution" }),
    ).toBeInTheDocument();
  });
});

describe("Signature FloatingDock", () => {
  it("renders CINEVA crimson brand tile and primary segmented navigation links", () => {
    render(<FloatingDock />);
    expect(screen.getByLabelText("CINEVA Home")).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /films/i })).toHaveAttribute("href", "/movies");
    expect(screen.getByRole("link", { name: /collections/i })).toHaveAttribute(
      "href",
      "/collections/monsoon-noir-archive",
    );
    expect(screen.getByRole("link", { name: /watchlist/i })).toHaveAttribute("href", "/watchlist");
    expect(screen.getByLabelText("Account Profile")).toHaveAttribute("href", "/account");
  });

  it("renders quick search trigger button", () => {
    render(<FloatingDock />);
    expect(screen.getByRole("button", { name: /^search$/i })).toBeInTheDocument();
  });
});
