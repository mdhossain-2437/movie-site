import "server-only";

import type { TitleHeroStageProps } from "@/components/catalogue/title-hero-stage";
import { isFixtureCatalogueEnabled } from "./stage";

export type DevShowcaseTitle = TitleHeroStageProps["title"];

const DEV_SHOWCASE_TITLES: readonly DevShowcaseTitle[] = [
  {
    id: "fix-the-last-monsoon",
    slug: "the-last-monsoon",
    featureAssetId: null,
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
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
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
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-neon-bhasha",
    slug: "neon-bhasha",
    featureAssetId: null,
    originalTitle: "Neon Bhasha",
    originalLanguage: "bn",
    releaseYear: 2023,
    runtimeMinutes: 104,
    maturityRating: "PG13",
    isDevelopmentFixture: true,
    localizedTitleEn: "Neon Bhasha",
    localizedTitleBn: "নিয়ন ভাষা",
    synopsisEn:
      "Cybernetic acoustic linguistics in a subterranean delta megacity running on analog relays.",
    synopsisBn: "ভূগর্ভস্থ বদ্বীপ মেগাসিটিতে অ্যানালগ রিলে চালিত ভাষাগত রহস্য।",
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [{ slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" }],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: "আমিনা রহমান",
      },
    ],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-shadows-over-buriganga",
    slug: "shadows-over-buriganga",
    featureAssetId: null,
    originalTitle: "Shadows Over Buriganga",
    originalLanguage: "bn",
    releaseYear: 2022,
    runtimeMinutes: 132,
    maturityRating: "R16",
    isDevelopmentFixture: true,
    localizedTitleEn: "Shadows Over Buriganga",
    localizedTitleBn: "বুড়িগঙ্গার ছায়া",
    synopsisEn:
      "A river police captain uncovers counterfeit chemical manifests drifting between river barges.",
    synopsisBn: "বুড়িগঙ্গার বার্জে ভেসে আসা জাল রাসায়নিক চালানের তদন্ত।",
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [{ slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" }],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: "আমিনা রহমান",
      },
    ],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-echoes-of-the-delta",
    slug: "echoes-of-the-delta",
    featureAssetId: null,
    originalTitle: "Echoes of the Delta",
    originalLanguage: "bn",
    releaseYear: 2021,
    runtimeMinutes: 92,
    maturityRating: "U",
    isDevelopmentFixture: true,
    localizedTitleEn: "Echoes of the Delta",
    localizedTitleBn: "বদ্বীপের প্রতিধ্বনি",
    synopsisEn:
      "Archival soundscapes of century-old wooden paddle steamers traversing the Sundarbans channels.",
    synopsisBn: "সুন্দরবনের খাল জুড়ে শতবর্ষী প্যাডেল স্টিমারের ধ্বনিচিত্র।",
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "download_allowed",
    },
    genres: [{ slug: "documentary", nameEn: "Documentary", nameBn: "প্রামাণ্যচিত্র" }],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: "আমিনা রহমান",
      },
    ],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-midnight-at-curzon-hall",
    slug: "midnight-at-curzon-hall",
    featureAssetId: null,
    originalTitle: "Midnight at Curzon Hall",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 126,
    maturityRating: "PG13",
    isDevelopmentFixture: true,
    localizedTitleEn: "Midnight at Curzon Hall",
    localizedTitleBn: "কার্জন হলে মধ্যরাত",
    synopsisEn:
      "A mathematical mystery unfolding across red-brick collegiate corridors during curfew.",
    synopsisBn: "কার্ফিউ চলাকালীন লাল ইটের করিডোর জুড়ে এক গাণিতিক রহস্য।",
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [{ slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" }],
    credits: [],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-voyage-beyond-stars",
    slug: "voyage-beyond-stars",
    featureAssetId: null,
    originalTitle: "Voyage Beyond Stars",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 140,
    maturityRating: "PG",
    isDevelopmentFixture: true,
    localizedTitleEn: "Voyage Beyond Stars",
    localizedTitleBn: "নক্ষত্রের ওপারে যাত্রা",
    synopsisEn:
      "A cosmic expedition navigating deep stellar magnetic storms to recover lost signal archives.",
    synopsisBn: "হারিয়ে যাওয়া সিগন্যাল আর্কাইভ উদ্ধারে মহাজাগতিক অভিযান।",
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [{ slug: "drama", nameEn: "Drama", nameBn: "নাটক" }],
    credits: [],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
  {
    id: "fix-symphony-of-the-loom",
    slug: "symphony-of-the-loom",
    featureAssetId: null,
    originalTitle: "Symphony of the Loom",
    originalLanguage: "bn",
    releaseYear: 2020,
    runtimeMinutes: 85,
    maturityRating: "U",
    isDevelopmentFixture: true,
    localizedTitleEn: "Symphony of the Loom",
    localizedTitleBn: "তাঁতের সিম্ফনি",
    synopsisEn:
      "The meditative, rhythmic visual poetry of traditional Jamdani master weavers along the Shitalakshya.",
    synopsisBn: "শীতলক্ষ্যার তীরে ঐতিহ্যবাহী জামদানি শিল্পীদের ছন্দময় কাব্য।",
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "download_allowed",
    },
    genres: [{ slug: "documentary", nameEn: "Documentary", nameBn: "প্রামাণ্যচিত্র" }],
    credits: [],
    sources: [
      {
        provider: "OPERATOR_ORIGINAL",
        attributionText: "Cinematic Graphite Development Showcase Fixture (Non-Production)",
      },
    ],
  },
];

export function getDevShowcaseTitleBySlug(slug: string): DevShowcaseTitle | null {
  if (!isFixtureCatalogueEnabled()) return null;
  return DEV_SHOWCASE_TITLES.find((t) => t.slug === slug) ?? null;
}

export function getDevShowcasePersonBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  if (slug !== "amina-rahman") return null;
  return {
    person: {
      id: "per-amina-rahman",
      slug: "amina-rahman",
      nameEn: "Amina Rahman",
      nameBn: "আমিনা রহমান",
      bio: "Contemporary Dhaka auteur celebrated for atmospheric riverine noir, tactile 35mm shadow work, and archival acoustic storytelling.",
    },
    titles: DEV_SHOWCASE_TITLES.slice(0, 4),
  };
}

export function getDevShowcaseCollectionBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  if (slug !== "monsoon-noir-archive") return null;
  return {
    collection: {
      id: "col-monsoon-noir-archive",
      slug: "monsoon-noir-archive",
      titleEn: "Monsoon Noir & Archival Vault",
      titleBn: "বর্ষা নোয়ার ও আর্কাইভ ভল্ট",
      description:
        "Rain-swept mysteries, riverfront investigations, and restored acoustic cinema from the Bengal delta.",
    },
    titles: DEV_SHOWCASE_TITLES,
  };
}

export function getDevShowcaseGenreBySlug(slug: string) {
  if (!isFixtureCatalogueEnabled()) return null;
  if (slug !== "noir") return null;
  return {
    genre: {
      id: "gen-noir",
      slug: "noir",
      nameEn: "Noir",
      nameBn: "নোয়ার",
    },
    titles: DEV_SHOWCASE_TITLES.filter((t) => t.genres?.some((g) => g.slug === "noir")),
  };
}
