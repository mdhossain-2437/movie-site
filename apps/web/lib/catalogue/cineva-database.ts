import type { CatalogueSort, MaturityRating, TitleKind } from "@movie/contracts";
import {
  type RankedTopRatedEntry,
  type RecommendationCandidate,
  type RecommendationMatch,
  rankTopRatedCandidates,
  recommendPersonalizedForSeeds,
  recommendSimilarTitles,
} from "@movie/domain";
import type { AvailabilityKind } from "@/components/ui/badge";
import type { ArtSpec } from "./types";

export interface CinevaSceneChapter {
  index: number;
  title: string;
  startSeconds: number;
  durationSeconds: number;
  summary: string;
}

export interface CinevaSubtitleCue {
  start: number;
  end: number;
  en: string;
  bn: string;
}

export interface CinevaCreditEntry {
  department: "DIRECTOR" | "ACTOR" | "WRITER";
  characterName?: string;
  billingOrder: number;
  personSlug: string;
  nameEn: string;
  nameBn?: string;
}

export interface CinevaGenreEntry {
  slug: string;
  nameEn: string;
  nameBn: string;
}

export interface CinevaEpisode {
  seasonNumber: number;
  episodeNumber: number;
  titleEn: string;
  titleBn: string;
  runtimeMinutes: number;
  synopsisEn: string;
  startSeconds: number;
}

export interface CinevaSeason {
  seasonNumber: number;
  titleEn: string;
  releaseYear: number;
  episodes: CinevaEpisode[];
}

export interface CinevaStudioHub {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  shortLabel: string;
  headquarters: string;
  foundedYear: number;
  bannerFocus: string;
  description: string;
}

export interface CinevaSpecialCategory {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  shortLabel: string;
  eyebrow: string;
  description: string;
}

export interface CinevaDatabaseFilm {
  id: string;
  slug: string;
  kind: TitleKind;
  rank?: number;
  originalTitle: string;
  originalLanguage: string;
  releaseYear: number;
  runtimeMinutes: number;
  maturityRating: MaturityRating;
  localizedTitleEn: string;
  localizedTitleBn: string;
  tagline: string;
  synopsisEn: string;
  synopsisBn: string;
  /** Percentage match/acclaim index (0..100) */
  cinevaScore: number;
  /** Authoritative 0..10 user/critic rating fed into Bayesian Weighted Rating */
  rawRating: number;
  /** Human-formatted vote count */
  votesCount: string;
  /** Exact numeric vote count fed into Bayesian Weighted Rating */
  voteCountNumeric: number;
  aspectRatio: string;
  soundMix: string;
  colorProcess: string;
  negativeFormat: string;
  country: string;
  studio: string;
  studioSlug: string;
  categorySlugs: string[];
  moodTags: string[];
  filmingLocations: string[];
  awardsNote: string;
  visualPreset:
    | "monsoon-noir"
    | "cyber-acoustic"
    | "river-thriller"
    | "delta-tide"
    | "curzon-mystery"
    | "stellar-voyage"
    | "jamdani-loom"
    | "crimson-express";
  art: ArtSpec;
  availability: {
    streamAllowed: boolean;
    downloadAllowed: boolean;
    metadataAllowed: boolean;
    badgeKind: AvailabilityKind;
  };
  genres: CinevaGenreEntry[];
  credits: CinevaCreditEntry[];
  chapters: CinevaSceneChapter[];
  subtitleCues: CinevaSubtitleCue[];
  seasons?: CinevaSeason[];
}

export interface CinevaPersonProfile {
  id: string;
  slug: string;
  nameEn: string;
  nameBn: string;
  primaryRole: string;
  bornYear: number;
  origin: string;
  bio: string;
}

export interface CinevaCuratedCollection {
  id: string;
  slug: string;
  titleEn: string;
  titleBn: string;
  eyebrow: string;
  description: string;
  filmSlugs: string[];
}

export const CINEVA_GENRES: readonly CinevaGenreEntry[] = [
  { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
  { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
  { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
  { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
  { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
  { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
  { slug: "documentary", nameEn: "Documentary", nameBn: "প্রামাণ্যচিত্র" },
  { slug: "classic", nameEn: "Classic", nameBn: "ধ্রুপদী" },
];

export const CINEVA_STUDIOS: readonly CinevaStudioHub[] = [
  {
    id: "std-monsoon-shadow",
    slug: "monsoon-shadow-studios",
    nameEn: "Monsoon Shadow Studios",
    nameBn: "মনসুন শ্যাডো স্টুডিওস",
    shortLabel: "Monsoon Shadow",
    headquarters: "Dhaka, Bangladesh",
    foundedYear: 2016,
    bannerFocus: "35mm Riverine Noir & Prestige Crime Series",
    description:
      "Flagship Dhaka production house behind CINEVA's signature rain-drenched thrillers, tactile 35mm shadow geometry, and multi-season detective dramas.",
  },
  {
    id: "std-vanguard-mythic",
    slug: "vanguard-mythic-studios",
    nameEn: "Vanguard Mythic Studios",
    nameBn: "ভ্যানগার্ড মিথিক স্টুডিওস",
    shortLabel: "Vanguard Mythic",
    headquarters: "London · Dhaka",
    foundedYear: 2019,
    bannerFocus: "Interconnected Heroic Multiverse & Cosmic Action",
    description:
      "Tentpole comic-mythos studio architecting interconnected armored guardians, orbital defense ensembles, and widescreen cosmic sagas.",
  },
  {
    id: "std-obsidian-knight",
    slug: "obsidian-knight-works",
    nameEn: "Obsidian Knight Works",
    nameBn: "অবসিডিয়ান নাইট ওয়ার্কস",
    shortLabel: "Obsidian Knight",
    headquarters: "Chicago · Dhaka",
    foundedYear: 2018,
    bannerFocus: "Dark Vigilante Mythos & Graphic-Noir Syndicates",
    description:
      "Graphic-novel cinema banner dedicated to nocturnal rooftop detectives, masked urban mythologies, and unforgiving crime sagas.",
  },
  {
    id: "std-pacific-starlight",
    slug: "pacific-starlight-pictures",
    nameEn: "Pacific Starlight Pictures",
    nameBn: "প্যাসিফিক স্টারলাইট পিকচার্স",
    shortLabel: "Pacific Starlight",
    headquarters: "Tokyo · Los Angeles · Dhaka",
    foundedYear: 2014,
    bannerFocus: "Global Cyber-Thrillers & Prestige Mystery Series",
    description:
      "International studio division producing high-concept cybernetic mysteries, architectural thrillers, and bilingual prestige television.",
  },
  {
    id: "std-meridian-century",
    slug: "meridian-century-pictures",
    nameEn: "Meridian Century Pictures",
    nameBn: "মেরিডিয়ান সেঞ্চুরি পিকচার্স",
    shortLabel: "Meridian Century",
    headquarters: "London · Vancouver",
    foundedYear: 2012,
    bannerFocus: "65mm Large-Format Sci-Fi & High-Speed Spectacles",
    description:
      "Major theatrical banner specializing in 65mm large-format expeditions, deep-ocean science fiction, and kinetic trans-continental thrillers.",
  },
  {
    id: "std-public-domain-vault",
    slug: "cineva-public-domain-vault",
    nameEn: "CINEVA Public Domain Vault",
    nameBn: "সিনেভা পাবলিক ডোমেইন ভল্ট",
    shortLabel: "Public Domain Vault",
    headquarters: "Stockholm · Dhaka Archival Lab",
    foundedYear: 2020,
    bannerFocus: "4K Nitrate Restorations & Open-Access Field Cinema",
    description:
      "Archival restoration unit preserving verified pre-1929 world cinema masters and UNESCO-cited delta documentaries with full stream and direct-download rights.",
  },
];

export const CINEVA_SPECIAL_CATEGORIES: readonly CinevaSpecialCategory[] = [
  {
    id: "cat-top-rated-hall",
    slug: "top-rated-hall",
    titleEn: "Top Rated Hall of Fame",
    titleBn: "শীর্ষ রেটেড হল অব ফেম",
    shortLabel: "Top Rated 9.0+",
    eyebrow: "Bayesian Weighted Leaderboard",
    description:
      "Highest-ranked films and series computed via Bayesian Weighted Rating (WR) balancing verified audience score against vote volume.",
  },
  {
    id: "cat-heroic-multiverse",
    slug: "heroic-multiverse",
    titleEn: "Vanguard Heroic Universe",
    titleBn: "ভ্যানগার্ড হিরোইক ইউনিভার্স",
    shortLabel: "Heroic Multiverse",
    eyebrow: "Cosmic & Powered Saga",
    description:
      "Interconnected exosuit defenders, orbital vanguard squads, and high-stakes multiverse anomalies across feature films and series.",
  },
  {
    id: "cat-dark-vigilante",
    slug: "dark-vigilante-mythos",
    titleEn: "Dark Vigilante Mythos",
    titleBn: "ডার্ক ভিজিল্যান্টে মিথোস",
    shortLabel: "Dark Vigilante",
    eyebrow: "Graphic-Noir Universe",
    description:
      "Brooding rooftop watchmen, syndicate crime wars, and neo-gothic detective mythology forged in rain and shadow.",
  },
  {
    id: "cat-original-series",
    slug: "original-series",
    titleEn: "CINEVA Original Series",
    titleBn: "সিনেভা অরিজিনাল সিরিজ",
    shortLabel: "Original Series",
    eyebrow: "Multi-Season Shows",
    description:
      "Episodic prestige dramas, sci-fi thrillers, and investigative limited series complete with multi-season chapter playback.",
  },
  {
    id: "cat-large-format",
    slug: "large-format-premieres",
    titleEn: "Large-Format 2.39:1 Premieres",
    titleBn: "লার্জ-ফরম্যাট ২.৩৯:১ প্রিমিয়ার",
    shortLabel: "2.39:1 Large Format",
    eyebrow: "Anamorphic & 65mm Masters",
    description:
      "Reference theatrical presentations mastered in 2.39:1 anamorphic widescreen and 65mm large-format digital with Dolby Atmos.",
  },
  {
    id: "cat-public-domain-vault",
    slug: "public-domain-vault",
    titleEn: "4K Open-Download Vault",
    titleBn: "৪কে ওপেন-ডাউনলোড ভল্ট",
    shortLabel: "Stream + Download",
    eyebrow: "Verified Open Rights",
    description:
      "Restored silent-era classics and archival field documentaries cleared for both adaptive streaming and offline file download.",
  },
];

export const CINEVA_PEOPLE: readonly CinevaPersonProfile[] = [
  {
    id: "per-amina-rahman",
    slug: "amina-rahman",
    nameEn: "Amina Rahman",
    nameBn: "আমিনা রহমান",
    primaryRole: "Director & Showrunner",
    bornYear: 1984,
    origin: "Dhaka, Bangladesh",
    bio: "Contemporary Dhaka auteur celebrated for atmospheric riverine noir, tactile 35mm shadow geometry, and prestige investigative series across the Bengal delta.",
  },
  {
    id: "per-tariq-anam",
    slug: "tariq-anam",
    nameEn: "Tariq Anam",
    nameBn: "তারিক আনাম",
    primaryRole: "Lead Actor",
    bornYear: 1959,
    origin: "Dhaka, Bangladesh",
    bio: "Veteran stage and screen performer renowned for restrained, razor-edged portrayals of investigators, vigilante mentors, and morally conflicted patriarchs.",
  },
  {
    id: "per-nusrat-imrose",
    slug: "nusrat-imrose",
    nameEn: "Nusrat Imrose",
    nameBn: "নুসরাত ইমরোজ",
    primaryRole: "Lead Actor",
    bornYear: 1989,
    origin: "Rajshahi, Bangladesh",
    bio: "Acclaimed dramatic lead known for cyber-noir thrillers, episodic crime sagas, and intimate chamber mysteries anchored in bilingual performance.",
  },
  {
    id: "per-kamal-hossain",
    slug: "kamal-hossain",
    nameEn: "Kamal Hossain",
    nameBn: "কামাল হোসেন",
    primaryRole: "Director",
    bornYear: 1978,
    origin: "Chattogram, Bangladesh",
    bio: "Graphic-noir and maritime thriller filmmaker combining widescreen anamorphic framing with practical industrial production design.",
  },
  {
    id: "per-elena-rostova",
    slug: "elena-rostova",
    nameEn: "Elena Rostova",
    nameBn: "এলেনা রোস্তোভা",
    primaryRole: "Director & Showrunner",
    bornYear: 1981,
    origin: "Prague · London",
    bio: "Hard-science cinema director specializing in deep-space signal thrillers, orbital mechanics, and analog telemetry aesthetics.",
  },
  {
    id: "per-rafiq-azad",
    slug: "rafiq-azad",
    nameEn: "Rafiq Azad",
    nameBn: "রফিক আজাদ",
    primaryRole: "Documentary Filmmaker",
    bornYear: 1975,
    origin: "Narayanganj, Bangladesh",
    bio: "Non-fiction cinema poet documenting endangered river crafts, Jamdani master looms, and deltaic soundscapes on large-format film.",
  },
  {
    id: "per-fazle-rabbi",
    slug: "fazle-rabbi",
    nameEn: "Fazle Rabbi",
    nameBn: "ফজলে রাব্বি",
    primaryRole: "Actor",
    bornYear: 1986,
    origin: "Sylhet, Bangladesh",
    bio: "Kinetic dramatic actor recognized for nocturnal crime dramas, armored tactical thrillers, and historical mysteries.",
  },
  {
    id: "per-aupee-karim",
    slug: "aupee-karim",
    nameEn: "Aupee Karim",
    nameBn: "অপি করিম",
    primaryRole: "Actor & Architect",
    bornYear: 1979,
    origin: "Dhaka, Bangladesh",
    bio: "Screen performer and architectural scholar bringing crisp intellectual intensity to cosmic sci-fi and ensemble mystery series.",
  },
  {
    id: "per-dev-sen",
    slug: "dev-sen",
    nameEn: "Dev Sen",
    nameBn: "দেব সেন",
    primaryRole: "Director · Mythic & Action Cinema",
    bornYear: 1983,
    origin: "Kolkata · London",
    bio: "Large-format action visionary architecting the Vanguard Heroic Universe with practical wirework, orbital scale, and operatic brass scores.",
  },
  {
    id: "per-zoya-mirza",
    slug: "zoya-mirza",
    nameEn: "Zoya Mirza",
    nameBn: "জোয়া মির্জা",
    primaryRole: "Lead Actor · Action & Sci-Fi",
    bornYear: 1992,
    origin: "Dhaka · London",
    bio: "Breakout physical performer anchoring CINEVA's heroic multiverse features and dark vigilante ensembles.",
  },
];

function buildDefaultChapters(filmTitle: string, runtimeMinutes: number): CinevaSceneChapter[] {
  const total = runtimeMinutes * 60;
  const step = Math.floor(total / 5);
  return [
    {
      index: 1,
      title: "I. Overture & Opening Frame",
      startSeconds: 0,
      durationSeconds: step,
      summary: `Atmospheric opening movement establishing the visual world of ${filmTitle}.`,
    },
    {
      index: 2,
      title: "II. The Signal in the Rain",
      startSeconds: step,
      durationSeconds: step,
      summary: "Hidden archival evidence surfaces, pulling the investigation into deeper waters.",
    },
    {
      index: 3,
      title: "III. Nocturne Crossing",
      startSeconds: step * 2,
      durationSeconds: step,
      summary: "A tense midnight confrontation unfolds across shadow-drenched architecture.",
    },
    {
      index: 4,
      title: "IV. Aperture of Truth",
      startSeconds: step * 3,
      durationSeconds: step,
      summary: "Fragments align as the central conspiracy is laid bare under unforgiving light.",
    },
    {
      index: 5,
      title: "V. Dawn Reckoning & Epilogue",
      startSeconds: step * 4,
      durationSeconds: total - step * 4,
      summary: "Final resolution and lingering coda as first light breaks across the horizon.",
    },
  ];
}

function buildSeriesEpisodes(
  seasonNumber: number,
  episodeSpecs: Array<{
    titleEn: string;
    titleBn: string;
    runtimeMinutes: number;
    synopsisEn: string;
  }>,
): CinevaEpisode[] {
  let cursorSeconds = 0;
  return episodeSpecs.map((spec, idx) => {
    const ep: CinevaEpisode = {
      seasonNumber,
      episodeNumber: idx + 1,
      titleEn: spec.titleEn,
      titleBn: spec.titleBn,
      runtimeMinutes: spec.runtimeMinutes,
      synopsisEn: spec.synopsisEn,
      startSeconds: cursorSeconds,
    };
    cursorSeconds += spec.runtimeMinutes * 15;
    return ep;
  });
}

export const CINEVA_DATABASE_FILMS: readonly CinevaDatabaseFilm[] = [
  {
    id: "fix-the-last-monsoon",
    slug: "the-last-monsoon",
    kind: "MOVIE",
    rank: 1,
    originalTitle: "The Last Monsoon",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 118,
    maturityRating: "PG13",
    localizedTitleEn: "The Last Monsoon",
    localizedTitleBn: "শেষ বর্ষা",
    tagline: "Every tide remembers what the city buried.",
    synopsisEn:
      "In the shadow of a prolonged monsoon in Old Dhaka, a film archivist uncovers a silver-nitrate reel implicating a riverfront dynasty in an unresolved 1980s disappearance.",
    synopsisBn:
      "পুরান ঢাকায় এক দীর্ঘ বর্ষার ছায়ায়, একজন মহাফেজখানা কর্মী একটি বিস্মৃত রিল আবিষ্কার করেন যা এক প্রভাবশালী পরিবারকে এক অমীমাংসিত নিখোঁজের সাথে যুক্ত করে।",
    cinevaScore: 96,
    rawRating: 9.4,
    votesCount: "18.4K",
    voteCountNumeric: 18400,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · 5.1 Surround",
    colorProcess: "35mm Cinema Color · Crimson DI",
    negativeFormat: "Kodak Vision3 500T 5219",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
    studioSlug: "monsoon-shadow-studios",
    categorySlugs: ["top-rated-hall", "large-format-premieres"],
    moodTags: ["rain", "archive", "investigation", "conspiracy", "riverfront"],
    filmingLocations: ["Sadarghat Riverfront, Old Dhaka", "Armanitola", "Buriganga Dockyards"],
    awardsNote: "Winner — Best Cinematography & Sound Design, Delta International Film Showcase",
    visualPreset: "monsoon-noir",
    art: {
      motif: "shadow",
      option: "beams",
      palette: {
        bg: "#090204",
        bg2: "#260509",
        ink: "#040102",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
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
        characterName: "Inspector Reza Chowdhury",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
      {
        department: "ACTOR",
        characterName: "Leila Kabir (Archivist)",
        billingOrder: 3,
        personSlug: "nusrat-imrose",
        nameEn: "Nusrat Imrose",
        nameBn: "নুসরাত ইমরোজ",
      },
      {
        department: "WRITER",
        billingOrder: 4,
        personSlug: "amina-rahman",
        nameEn: "Amina Rahman",
        nameBn: "আমিনা রহমান",
      },
    ],
    chapters: buildDefaultChapters("The Last Monsoon", 118),
    subtitleCues: [
      {
        start: 0,
        end: 8,
        en: "[Rain hammering corrugated tin roofs across Sadarghat]",
        bn: "[সদরঘাটের টিনের চালে মুষলধারে বৃষ্টির শব্দ]",
      },
      {
        start: 8,
        end: 18,
        en: "LEILA: This 1984 reel was logged as destroyed in the warehouse flood.",
        bn: "লেইলা: ১৯৮৪ সালের এই রিলটি গুদামের বন্যায় নষ্ট হয়েছে বলে নথিভুক্ত ছিল।",
      },
      {
        start: 18,
        end: 30,
        en: "CHOWDHURY: Look at the launch number in the background. Nobody meant for that frame to survive.",
        bn: "চৌধুরী: পেছনের লঞ্চের নম্বরটা দেখুন। এই ফ্রেমটা টিকে থাকুক তা কেউ চায়নি।",
      },
      {
        start: 30,
        end: 60,
        en: "LEILA: Every tide brings the ledger back to shore.",
        bn: "লেইলা: প্রতিটি জোয়ার হিসাবের খাতা তীরে ফিরিয়ে আনে।",
      },
    ],
  },
  {
    id: "fix-neon-bhasha",
    slug: "neon-bhasha",
    kind: "MOVIE",
    rank: 2,
    originalTitle: "Neon Bhasha",
    originalLanguage: "bn",
    releaseYear: 2023,
    runtimeMinutes: 104,
    maturityRating: "PG13",
    localizedTitleEn: "Neon Bhasha",
    localizedTitleBn: "নিয়ন ভাষা",
    tagline: "In a city of silenced frequencies, memory speaks in code.",
    synopsisEn:
      "Cybernetic acoustic linguists inside a subterranean delta megacity decode analog tape relays carrying outlawed dialects across flooded transit tunnels.",
    synopsisBn:
      "ভূগর্ভস্থ বদ্বীপ মেগাসিটিতে অ্যানালগ রিলে চালিত নিষিদ্ধ উপভাষার সংকেত উদ্ধার করেন এক ধ্বনিবিজ্ঞানী।",
    cinevaScore: 93,
    rawRating: 9.0,
    votesCount: "14.1K",
    voteCountNumeric: 14100,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · Discrete Binaural Mix",
    colorProcess: "Digital Anamorphic · Ruby & Tungsten LUT",
    negativeFormat: "ARRI Alexa Mini LF · Atlas Orion",
    country: "Bangladesh",
    studio: "Pacific Starlight Pictures",
    studioSlug: "pacific-starlight-pictures",
    categorySlugs: ["large-format-premieres"],
    moodTags: ["cybernetic", "signal", "dystopian", "underground", "archive"],
    filmingLocations: ["Tejgaon Industrial District", "Metro Viaduct Sector 7"],
    awardsNote: "Official Selection — Asian Speculative Cinema Competition",
    visualPreset: "cyber-acoustic",
    art: {
      motif: "screen",
      option: "beams",
      palette: {
        bg: "#070709",
        bg2: "#24060A",
        ink: "#020203",
        accent: "#E50914",
        light: "#F5EDE0",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
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
        characterName: "Dr. Zara Karim",
        billingOrder: 2,
        personSlug: "nusrat-imrose",
        nameEn: "Nusrat Imrose",
        nameBn: "নুসরাত ইমরোজ",
      },
    ],
    chapters: buildDefaultChapters("Neon Bhasha", 104),
    subtitleCues: [
      {
        start: 0,
        end: 10,
        en: "[Analog carrier wave hums at 432 Hz]",
        bn: "[৪৩২ হার্জে অ্যানালগ ক্যারিয়ার তরঙ্গের গুঞ্জন]",
      },
      {
        start: 10,
        end: 25,
        en: "ZARA: The relay isn't noise—it's an old river lullaby encrypted in pulse width.",
        bn: "জারা: এই রিলে কোনো যান্ত্রিক শব্দ নয়—এটি পালস কোডে লুকানো এক প্রাচীন নদীর ঘুমপাড়ানি গান।",
      },
    ],
  },
  {
    id: "fix-shadows-over-buriganga",
    slug: "shadows-over-buriganga",
    kind: "MOVIE",
    rank: 3,
    originalTitle: "Shadows Over Buriganga",
    originalLanguage: "bn",
    releaseYear: 2022,
    runtimeMinutes: 132,
    maturityRating: "R16",
    localizedTitleEn: "Shadows Over Buriganga",
    localizedTitleBn: "বুড়িগঙ্গার ছায়া",
    tagline: "Fog hides the cargo. Steel remembers the wake.",
    synopsisEn:
      "Over forty-eight sleepless hours on winter river patrol, a harbour captain tracks ghost barges moving forged chemical manifests beneath heavy industrial fog.",
    synopsisBn:
      "শীতের ঘন কুয়াশায় আটচল্লিশ ঘণ্টার নদী টহলে এক ক্যাপ্টেন জাল রাসায়নিক চালানবাহী বার্জের সন্ধান পান।",
    cinevaScore: 91,
    rawRating: 8.8,
    votesCount: "11.9K",
    voteCountNumeric: 11900,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "5.1 Theatrical Surround",
    colorProcess: "35mm Cinema Color",
    negativeFormat: "35mm 4-Perf Anamorphic",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
    studioSlug: "monsoon-shadow-studios",
    categorySlugs: ["large-format-premieres"],
    moodTags: ["riverfront", "fog", "conspiracy", "manhunt", "nocturnal"],
    filmingLocations: ["Keraniganj Shipyards", "Pagla Ghat"],
    awardsNote: "Best Director — South Asian Crime & Noir Jury Prize",
    visualPreset: "river-thriller",
    art: {
      motif: "tower",
      option: "factory",
      palette: {
        bg: "#080808",
        bg2: "#1F0A0C",
        ink: "#000000",
        accent: "#D90B16",
        light: "#EFE8DC",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
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
        characterName: "Captain Masud",
        billingOrder: 2,
        personSlug: "fazle-rabbi",
        nameEn: "Fazle Rabbi",
        nameBn: "ফজলে রাব্বি",
      },
    ],
    chapters: buildDefaultChapters("Shadows Over Buriganga", 132),
    subtitleCues: [
      {
        start: 0,
        end: 14,
        en: "[Distant foghorn echoes across iron hulls]",
        bn: "[লোহার বার্জের ওপাশ থেকে দূরের ফগহর্নের প্রতিধ্বনি]",
      },
      {
        start: 14,
        end: 28,
        en: "MASUD: Cut the searchlight. Let their wake betray the rudder.",
        bn: "মাসুদ: সার্চলাইট নিভিয়ে দাও। ওদের ঢেউই পথ চিনিয়ে দেবে।",
      },
    ],
  },
  {
    id: "fix-voyage-beyond-stars",
    slug: "voyage-beyond-stars",
    kind: "MOVIE",
    rank: 4,
    originalTitle: "Voyage Beyond Stars",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 140,
    maturityRating: "PG",
    localizedTitleEn: "Voyage Beyond Stars",
    localizedTitleBn: "নক্ষত্রের ওপারে যাত্রা",
    tagline: "Twelve light-hours past Neptune, the archive answered back.",
    synopsisEn:
      "A deep-space cartography crew crosses a crimson magnetosphere to retrieve humanity's earliest interstellar probe—discovering fifty years of unscheduled transmissions.",
    synopsisBn:
      "নেপচুন ছাড়িয়ে গভীর মহাকাশে এক অভিযাত্রী দল মানবজাতির প্রাচীনতম মহাকাশযানের রহস্যময় সংকেত উদ্ধার করে।",
    cinevaScore: 95,
    rawRating: 9.3,
    votesCount: "22.7K",
    voteCountNumeric: 22700,
    aspectRatio: "2.39:1 Large-Format Widescreen",
    soundMix: "Dolby Atmos · 7.1 Theatrical",
    colorProcess: "65mm Large Format Digital Master",
    negativeFormat: "65mm Digital Cinema Master",
    country: "United Kingdom · Bangladesh",
    studio: "Meridian Century Pictures",
    studioSlug: "meridian-century-pictures",
    categorySlugs: ["top-rated-hall", "large-format-premieres"],
    moodTags: ["cosmic", "orbital", "signal", "expedition", "widescreen"],
    filmingLocations: ["Atacama Array", "Stage 4 Optical Tank"],
    awardsNote: "Grand Jury Technical Achievement in Visual Effects & Sound",
    visualPreset: "stellar-voyage",
    art: {
      motif: "horizon",
      option: "crescent",
      palette: {
        bg: "#050507",
        bg2: "#2B060B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "elena-rostova",
        nameEn: "Elena Rostova",
        nameBn: "এলেনা রোস্তোভা",
      },
      {
        department: "ACTOR",
        characterName: "Commander Aria Sen",
        billingOrder: 2,
        personSlug: "aupee-karim",
        nameEn: "Aupee Karim",
        nameBn: "অপি করিম",
      },
    ],
    chapters: buildDefaultChapters("Voyage Beyond Stars", 140),
    subtitleCues: [
      {
        start: 0,
        end: 12,
        en: "TELEMETRY: Magnetopause boundary crossed. Dish alignment nominal.",
        bn: "টেলিমেট্রি: ম্যাগনেটোপজ সীমানা অতিক্রম করেছে। অ্যান্টেনা সংযোগ স্বাভাবিক।",
      },
      {
        start: 12,
        end: 26,
        en: "ARIA: The golden record wasn't silent—someone recorded a reply onto track four.",
        bn: "আরিয়া: গোল্ডেন রেকর্ডটি নীরব ছিল না—চতুর্থ ট্র্যাকে কেউ উত্তর রেকর্ড করেছে।",
      },
    ],
  },
  {
    id: "fix-midnight-at-curzon-hall",
    slug: "midnight-at-curzon-hall",
    kind: "MOVIE",
    rank: 5,
    originalTitle: "Midnight at Curzon Hall",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 126,
    maturityRating: "PG13",
    localizedTitleEn: "Midnight at Curzon Hall",
    localizedTitleBn: "কার্জন হলে মধ্যরাত",
    tagline: "Four scholars. One locked observatory. Zero coincidences.",
    synopsisEn:
      "During a citywide power blackout, a visiting mathematician discovers geometric cipher plates hidden inside the red-brick arches of Dhaka's historic science hall.",
    synopsisBn:
      "শহরজুড়ে ব্ল্যাকআউটের রাতে লাল ইটের ঐতিহাসিক কার্জন হলের খিলানে লুকানো গাণিতিক সংকেত আবিষ্কার করেন এক গবেষক।",
    cinevaScore: 92,
    rawRating: 8.9,
    votesCount: "12.8K",
    voteCountNumeric: 12800,
    aspectRatio: "1.85:1 Spherical",
    soundMix: "5.1 Surround",
    colorProcess: "35mm Crimson & Ochre Print",
    negativeFormat: "35mm Spherical",
    country: "Bangladesh",
    studio: "Pacific Starlight Pictures",
    studioSlug: "pacific-starlight-pictures",
    categorySlugs: ["top-rated-hall"],
    moodTags: ["cipher", "architecture", "blackout", "investigation", "nocturnal"],
    filmingLocations: ["Curzon Hall Colonnade", "Old High Court Gate"],
    awardsNote: "Best Screenplay — Dhaka Critics Circle",
    visualPreset: "curzon-mystery",
    art: {
      motif: "door",
      option: "domes",
      palette: {
        bg: "#0A0405",
        bg2: "#33080D",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "kamal-hossain",
        nameEn: "Kamal Hossain",
        nameBn: "কামাল হোসেন",
      },
      {
        department: "ACTOR",
        characterName: "Prof. Nadia Sen",
        billingOrder: 2,
        personSlug: "aupee-karim",
        nameEn: "Aupee Karim",
        nameBn: "অপি করিম",
      },
    ],
    chapters: buildDefaultChapters("Midnight at Curzon Hall", 126),
    subtitleCues: [
      {
        start: 0,
        end: 15,
        en: "NADIA: Count the arches from the west stairwell—the eleventh keystone turns.",
        bn: "নাদিয়া: পশ্চিম সিঁড়ি থেকে খিলানগুলো গুনুন—এগারো নম্বর পাথরটি ঘোরে।",
      },
    ],
  },
  {
    id: "fix-echoes-of-the-delta",
    slug: "echoes-of-the-delta",
    kind: "MOVIE",
    rank: 6,
    originalTitle: "Echoes of the Delta",
    originalLanguage: "bn",
    releaseYear: 2021,
    runtimeMinutes: 92,
    maturityRating: "U",
    localizedTitleEn: "Echoes of the Delta",
    localizedTitleBn: "বদ্বীপের প্রতিধ্বনি",
    tagline: "A century of iron paddlewheels gliding through mangrove mist.",
    synopsisEn:
      "Recorded on field hydrophones and 16mm reversal stock, this meditative portrait follows the last rocket paddle steamers navigating the tidal channels of the Sundarbans.",
    synopsisBn:
      "সুন্দরবনের জোয়ার-ভাটার খাল জুড়ে শতবর্ষী প্যাডেল স্টিমারের ছন্দময় যাত্রা ও ধ্বনিচিত্র।",
    cinevaScore: 94,
    rawRating: 9.1,
    votesCount: "9.3K",
    voteCountNumeric: 9300,
    aspectRatio: "1.85:1 Widescreen",
    soundMix: "Quadraphonic Field Recording · Stereo",
    colorProcess: "16mm Ektachrome Scan · 4K Restoration",
    negativeFormat: "Super 16mm",
    country: "Bangladesh",
    studio: "CINEVA Public Domain Vault",
    studioSlug: "cineva-public-domain-vault",
    categorySlugs: ["public-domain-vault"],
    moodTags: ["river", "heritage", "meditative", "archival", "soundscape"],
    filmingLocations: ["Mongla", "Hiron Point", "Barishal River Station"],
    awardsNote: "Golden Reed — World Eco-Documentary Festival",
    visualPreset: "delta-tide",
    art: {
      motif: "forest",
      option: "crescent",
      palette: {
        bg: "#070606",
        bg2: "#210B09",
        ink: "#000000",
        accent: "#E50914",
        light: "#F6EFE2",
      },
    },
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
      {
        department: "WRITER",
        billingOrder: 2,
        personSlug: "rafiq-azad",
        nameEn: "Rafiq Azad",
        nameBn: "রফিক আজাদ",
      },
    ],
    chapters: buildDefaultChapters("Echoes of the Delta", 92),
    subtitleCues: [
      {
        start: 0,
        end: 20,
        en: "[Rhythmic churn of paddlewheel blades against slack water]",
        bn: "[স্থির জলে প্যাডেল স্টিমারের চাকার ছন্দময় ধ্বনি]",
      },
    ],
  },
  {
    id: "fix-symphony-of-the-loom",
    slug: "symphony-of-the-loom",
    kind: "MOVIE",
    rank: 7,
    originalTitle: "Symphony of the Loom",
    originalLanguage: "bn",
    releaseYear: 2020,
    runtimeMinutes: 85,
    maturityRating: "U",
    localizedTitleEn: "Symphony of the Loom",
    localizedTitleBn: "তাঁতের সিম্ফনি",
    tagline: "Woven from river air, Geometry, and three hundred thread-counts of light.",
    synopsisEn:
      "An intimate visual poem chronicling master Jamdani weavers along the Shitalakshya river, where mathematical memory is passed entirely through oral chant.",
    synopsisBn:
      "শীতলক্ষ্যার তীরে ঐতিহ্যবাহী জামদানি তাঁতশিল্পীদের গাণিতিক বুনন ও মৌখিক ছন্দের প্রামাণ্য কাব্য।",
    cinevaScore: 90,
    rawRating: 8.7,
    votesCount: "7.6K",
    voteCountNumeric: 7600,
    aspectRatio: "1.85:1 Widescreen",
    soundMix: "24-bit Acoustic Master",
    colorProcess: "Silver-Halide & Warm Ivory Grade",
    negativeFormat: "35mm 3-Perf",
    country: "Bangladesh",
    studio: "CINEVA Public Domain Vault",
    studioSlug: "cineva-public-domain-vault",
    categorySlugs: ["public-domain-vault"],
    moodTags: ["heritage", "craft", "meditative", "river", "soundscape"],
    filmingLocations: ["Sonargaon", "Rupganj"],
    awardsNote: "UNESCO Intangible Heritage Cinema Citation",
    visualPreset: "jamdani-loom",
    art: {
      motif: "constructivist",
      option: "rails",
      palette: {
        bg: "#080707",
        bg2: "#26080B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "download_allowed",
    },
    genres: [
      { slug: "documentary", nameEn: "Documentary", nameBn: "প্রামাণ্যচিত্র" },
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "rafiq-azad",
        nameEn: "Rafiq Azad",
        nameBn: "রফিক আজাদ",
      },
    ],
    chapters: buildDefaultChapters("Symphony of the Loom", 85),
    subtitleCues: [
      {
        start: 0,
        end: 20,
        en: "WEAVER CHANT: Four threads up, one crimson cross—hold the tension steady.",
        bn: "তাঁতিদের ছড়া: চার সুতো উপরে, এক লাল ভাঁজ—টান রাখো স্থির।",
      },
    ],
  },
  {
    id: "fix-crimson-express",
    slug: "crimson-express",
    kind: "MOVIE",
    rank: 8,
    originalTitle: "The Crimson Express",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 129,
    maturityRating: "PG13",
    localizedTitleEn: "The Crimson Express",
    localizedTitleBn: "ক্রিমসন এক্সপ্রেস",
    tagline: "Seven carriages. Zero stops before the border.",
    synopsisEn:
      "Aboard an overnight trans-delta sleeper train locked down during a diplomatic courier transfer, an off-duty signal engineer spots a phantom locomotive mirroring their track.",
    synopsisBn:
      "রাতের আন্তঃসীমান্ত ট্রেনে এক সিগন্যাল প্রকৌশলী আবিষ্কার করেন তাদের সমান্তরালে ছুটে চলেছে এক রহস্যময় ইঞ্জিন।",
    cinevaScore: 91,
    rawRating: 8.9,
    votesCount: "16.2K",
    voteCountNumeric: 16200,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · 5.1",
    colorProcess: "35mm Cinema Color",
    negativeFormat: "35mm Anamorphic",
    country: "Bangladesh · United Kingdom",
    studio: "Meridian Century Pictures",
    studioSlug: "meridian-century-pictures",
    categorySlugs: ["large-format-premieres"],
    moodTags: ["train", "conspiracy", "high-speed", "nocturnal", "manhunt"],
    filmingLocations: ["Hardinge Bridge", "Ishwardi Junction"],
    awardsNote: "Audience Choice — Midnight Thrillers Showcase",
    visualPreset: "crimson-express",
    art: {
      motif: "sun",
      option: "rails",
      palette: {
        bg: "#090203",
        bg2: "#3B060D",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
      { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "kamal-hossain",
        nameEn: "Kamal Hossain",
        nameBn: "কামাল হোসেন",
      },
      {
        department: "ACTOR",
        characterName: "Arman Kabir",
        billingOrder: 2,
        personSlug: "fazle-rabbi",
        nameEn: "Fazle Rabbi",
        nameBn: "ফজলে রাব্বি",
      },
    ],
    chapters: buildDefaultChapters("The Crimson Express", 129),
    subtitleCues: [
      {
        start: 0,
        end: 18,
        en: "[Steel wheels clattering at 110 km/h across river truss bridge]",
        bn: "[নদীর লোহার সেতু জুড়ে ঘণ্টায় ১১০ কিমি বেগে ট্রেনের চাকার গর্জন]",
      },
    ],
  },
  {
    id: "fix-sunken-observatory",
    slug: "the-sunken-observatory",
    kind: "MOVIE",
    rank: 9,
    originalTitle: "The Sunken Observatory",
    originalLanguage: "en",
    releaseYear: 2024,
    runtimeMinutes: 112,
    maturityRating: "PG",
    localizedTitleEn: "The Sunken Observatory",
    localizedTitleBn: "নিমজ্জিত মানমন্দির",
    tagline: "Beneath the Bay of Bengal lies a telescope pointed inward.",
    synopsisEn:
      "Marine geophysicists mapping the Swatch of No Ground submarine canyon locate an intact brass astrolabe dome built a century before modern sonar.",
    synopsisBn:
      "বঙ্গোপসাগরের গভীর গিরিখাতে সমুদ্রবিজ্ঞানীরা আবিষ্কার করেন শতবর্ষ প্রাচীন এক অক্ষত পিতলের মানমন্দির।",
    cinevaScore: 89,
    rawRating: 8.6,
    votesCount: "10.4K",
    voteCountNumeric: 10400,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos",
    colorProcess: "Digital Cinema 4K",
    negativeFormat: "Large Format Digital",
    country: "United Kingdom · Bangladesh",
    studio: "Meridian Century Pictures",
    studioSlug: "meridian-century-pictures",
    categorySlugs: ["large-format-premieres"],
    moodTags: ["expedition", "deep-ocean", "cipher", "signal", "widescreen"],
    filmingLocations: ["Cox's Bazar Deep Shelf", "Chattogram Naval Basin"],
    awardsNote: "Best Production Design — Maritime Cinema Society",
    visualPreset: "stellar-voyage",
    art: {
      motif: "lens",
      option: "crescent",
      palette: {
        bg: "#060608",
        bg2: "#24070B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "elena-rostova",
        nameEn: "Elena Rostova",
        nameBn: "এলেনা রোস্তোভা",
      },
    ],
    chapters: buildDefaultChapters("The Sunken Observatory", 112),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "SONAR: Canyon depth 1,340 meters. Brass resonance confirmed.",
        bn: "সোনার: গিরিখাতের গভীরতা ১,৩৪০ মিটার। পিতলের প্রতিধ্বনি নিশ্চিত।",
      },
    ],
  },
  {
    id: "fix-dhaka-nocturne",
    slug: "dhaka-nocturne",
    kind: "MOVIE",
    rank: 10,
    originalTitle: "Dhaka Nocturne",
    originalLanguage: "bn",
    releaseYear: 2023,
    runtimeMinutes: 109,
    maturityRating: "PG13",
    localizedTitleEn: "Dhaka Nocturne",
    localizedTitleBn: "ঢাকা নকটার্ন",
    tagline: "Three strangers. One all-night radio broadcast.",
    synopsisEn:
      "Between midnight and first call to prayer, a late-night jazz host, a taxi mechanic, and an ER surgeon cross paths through a single lost cassette tape.",
    synopsisBn:
      "মধ্যরাত থেকে ভোর পর্যন্ত এক রেডিও সঞ্চালক, একজন মেকানিক ও একজন চিকিৎসকের জীবন এক হারানো ক্যাসেটে মিলে যায়।",
    cinevaScore: 92,
    rawRating: 8.9,
    votesCount: "13.5K",
    voteCountNumeric: 13500,
    aspectRatio: "1.85:1 Spherical",
    soundMix: "5.1 Jazz & Room-Tone Mix",
    colorProcess: "35mm Warm Tungsten & Crimson",
    negativeFormat: "35mm 3-Perf",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
    studioSlug: "monsoon-shadow-studios",
    categorySlugs: [],
    moodTags: ["nocturnal", "radio", "rain", "ensemble", "jazz"],
    filmingLocations: ["Dhanmondi", "Hatirjheel Overpass", "Kawran Bazar"],
    awardsNote: "Best Ensemble Cast — Independent Film Guild",
    visualPreset: "monsoon-noir",
    art: {
      motif: "spiral",
      option: "beams",
      palette: {
        bg: "#080405",
        bg2: "#2C070C",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
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
        characterName: "Farhan (Radio Host)",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
    ],
    chapters: buildDefaultChapters("Dhaka Nocturne", 109),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "FARHAN (ON AIR): It's 2:14 AM in Dhaka. If you're still awake, this frequency is yours.",
        bn: "ফারহান (রেডিওতে): ঢাকায় এখন রাত ২টা ১৪। যারা জেগে আছেন, এই ফ্রিকোয়েন্সি আপনাদের।",
      },
    ],
  },
  {
    id: "fix-cabinet-of-caligari-restored",
    slug: "the-phantom-carriage-1921",
    kind: "MOVIE",
    originalTitle: "Körkarlen",
    originalLanguage: "en",
    releaseYear: 1921,
    runtimeMinutes: 107,
    maturityRating: "PG",
    localizedTitleEn: "The Phantom Carriage (4K Restoration)",
    localizedTitleBn: "দ্য ফ্যান্টম ক্যারেজ (১৯২১ পুনরুদ্ধার)",
    tagline: "Double-exposure pioneer of world gothic cinema—public domain master.",
    synopsisEn:
      "On New Year's Eve, legend holds that the last soul to die before midnight must drive Death's spectral carriage for the coming year. Public-domain silent masterwork with newly commissioned chamber score.",
    synopsisBn:
      "নববর্ষের মধ্যরাতে মৃত্যুর রথ চালানোর প্রাচীন উপকথা নিয়ে নির্মিত ১৯২১ সালের পাবলিক ডোমেইন ধ্রুপদী চলচ্চিত্র।",
    cinevaScore: 97,
    rawRating: 9.6,
    votesCount: "31.0K",
    voteCountNumeric: 31000,
    aspectRatio: "1.33:1 Silent Full Aperture",
    soundMix: "2024 Chamber Strings & Pipe Organ Score",
    colorProcess: "Silver-Halide Tinted Nitrate Restoration",
    negativeFormat: "35mm Orthochromatic Nitrate (Public Domain)",
    country: "Sweden (Public Domain)",
    studio: "CINEVA Public Domain Vault",
    studioSlug: "cineva-public-domain-vault",
    categorySlugs: ["top-rated-hall", "public-domain-vault"],
    moodTags: ["gothic", "archival", "mythic", "restoration"],
    filmingLocations: ["Råsunda Filmstaden"],
    awardsNote: "Verified Pre-1929 Public Domain Master · 4K Archival Scan",
    visualPreset: "curzon-mystery",
    art: {
      motif: "wheel",
      option: "turrets",
      palette: {
        bg: "#070707",
        bg2: "#22080A",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "download_allowed",
    },
    genres: [
      { slug: "classic", nameEn: "Classic", nameBn: "ধ্রুপদী" },
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "rafiq-azad",
        nameEn: "Victor Sjöström (Restored by R. Azad)",
        nameBn: "ভিক্টর সিওস্ট্রোম",
      },
    ],
    chapters: buildDefaultChapters("The Phantom Carriage", 107),
    subtitleCues: [
      {
        start: 0,
        end: 18,
        en: "[INTERTITLE] Midnight strikes from the old abbey bell-tower.",
        bn: "[শিরোনাম কার্ড] প্রাচীন গির্জার ঘণ্টায় মধ্যরাতের ধ্বনি বাজে।",
      },
    ],
  },
  {
    id: "fix-safety-last-1923",
    slug: "the-lodger-1927",
    kind: "MOVIE",
    originalTitle: "The Lodger: A Story of the London Fog",
    originalLanguage: "en",
    releaseYear: 1927,
    runtimeMinutes: 91,
    maturityRating: "PG",
    localizedTitleEn: "The Lodger: London Fog (1927)",
    localizedTitleBn: "দ্য লজার: লন্ডন ফগ (১৯২৭)",
    tagline: "Footsteps overhead through a glass ceiling—archival suspense.",
    synopsisEn:
      "As evening fog blankets Bloomsbury, a landlady begins to suspect her quiet upstairs boarder may be the nocturnal fugitive haunting Tuesday nights.",
    synopsisBn:
      "কুয়াশাচ্ছন্ন সন্ধ্যায় এক বাড়িওয়ালী সন্দেহ করতে শুরু করেন তার ওপরতলার শান্ত ভাড়াটিয়াই হয়তো রাতের পলাতক আসামি।",
    cinevaScore: 93,
    rawRating: 9.1,
    votesCount: "19.8K",
    voteCountNumeric: 19800,
    aspectRatio: "1.33:1 Academy",
    soundMix: "Restored Symphonic Suspense Score",
    colorProcess: "Amber & Crimson Tinted Archival Print",
    negativeFormat: "35mm Public Domain Archival Print",
    country: "United Kingdom (Public Domain)",
    studio: "CINEVA Public Domain Vault",
    studioSlug: "cineva-public-domain-vault",
    categorySlugs: ["top-rated-hall", "public-domain-vault"],
    moodTags: ["fog", "manhunt", "investigation", "archival", "nocturnal"],
    filmingLocations: ["Islington Studios, London"],
    awardsNote: "Verified Pre-1929 Public Domain Suspense Classic",
    visualPreset: "river-thriller",
    art: {
      motif: "steps",
      option: "beams",
      palette: {
        bg: "#080607",
        bg2: "#29070B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: true,
      metadataAllowed: true,
      badgeKind: "download_allowed",
    },
    genres: [
      { slug: "classic", nameEn: "Classic", nameBn: "ধ্রুপদী" },
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "elena-rostova",
        nameEn: "Archival Restoration Unit",
        nameBn: "আর্কাইভ পুনরুদ্ধার ইউনিট",
      },
    ],
    chapters: buildDefaultChapters("The Lodger", 91),
    subtitleCues: [
      {
        start: 0,
        end: 18,
        en: "[INTERTITLE] TO-NIGHT — GOLDEN CURLS.",
        bn: "[শিরোনাম কার্ড] আজ রাতে — ঘন কুয়াশায় সতর্কতা।",
      },
    ],
  },
  {
    id: "fix-iron-eclipse",
    slug: "iron-eclipse",
    kind: "MOVIE",
    rank: 11,
    originalTitle: "Iron Eclipse: Vanguard Protocol",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 146,
    maturityRating: "PG13",
    localizedTitleEn: "Iron Eclipse: Vanguard Protocol",
    localizedTitleBn: "লৌহ গ্রহণ: ভ্যানগার্ড প্রোটোকল",
    tagline: "When the orbital shield fractures, six guardians hold the sky.",
    synopsisEn:
      "After a solar-storm breach disables Earth's defense lattice, an armored Vanguard engineer and a rogue telemetry pilot unite a fractured squad across a collapsing sky-elevator.",
    synopsisBn:
      "সৌরঝড়ে পৃথিবীর প্রতিরক্ষা বলয় ভেঙে পড়লে এক বর্মধারী প্রকৌশলী ও এক পাইলট মহাকাশ লিফট রক্ষায় একত্রিত হন।",
    cinevaScore: 95,
    rawRating: 9.3,
    votesCount: "29.4K",
    voteCountNumeric: 29400,
    aspectRatio: "2.39:1 Large-Format Anamorphic",
    soundMix: "Dolby Atmos · 7.1 Theatrical",
    colorProcess: "65mm Digital Master · Solar Crimson LUT",
    negativeFormat: "65mm Large Format Digital",
    country: "United Kingdom · Bangladesh",
    studio: "Vanguard Mythic Studios",
    studioSlug: "vanguard-mythic-studios",
    categorySlugs: ["top-rated-hall", "heroic-multiverse", "large-format-premieres"],
    moodTags: ["heroic", "multiverse", "cosmic", "armored", "widescreen", "high-speed"],
    filmingLocations: ["Pinewood Stage E", "Bay of Bengal Launch Platform"],
    awardsNote: "Winner — Best Action Choreography & Sound Effects, Global Genre Awards",
    visualPreset: "crimson-express",
    art: {
      motif: "shards",
      option: "beams",
      palette: {
        bg: "#090204",
        bg2: "#3E060E",
        ink: "#020102",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "dev-sen",
        nameEn: "Dev Sen",
        nameBn: "দেব সেন",
      },
      {
        department: "ACTOR",
        characterName: "Captain Rhea Solis (Vanguard-01)",
        billingOrder: 2,
        personSlug: "zoya-mirza",
        nameEn: "Zoya Mirza",
        nameBn: "জোয়া মির্জা",
      },
      {
        department: "ACTOR",
        characterName: "Commander Kian Mahmud",
        billingOrder: 3,
        personSlug: "fazle-rabbi",
        nameEn: "Fazle Rabbi",
        nameBn: "ফজলে রাব্বি",
      },
    ],
    chapters: buildDefaultChapters("Iron Eclipse: Vanguard Protocol", 146),
    subtitleCues: [
      {
        start: 0,
        end: 15,
        en: "RHEA: Thrusters at 104%. If that tether snaps, half the coast goes dark.",
        bn: "রিয়া: থ্রাস্টার ১০৪ শতাংশে। এই তার ছিঁড়লে পুরো উপকূল অন্ধকারে ডুবে যাবে।",
      },
      {
        start: 15,
        end: 32,
        en: "KIAN: Vanguard formation—lock shields on my mark!",
        bn: "কিয়ান: ভ্যানগার্ড ফরমেশন—আমার সংকেতে বর্ম যুক্ত করো!",
      },
    ],
  },
  {
    id: "fix-obsidian-watchman",
    slug: "the-obsidian-watchman",
    kind: "MOVIE",
    rank: 12,
    originalTitle: "The Obsidian Watchman",
    originalLanguage: "en",
    releaseYear: 2024,
    runtimeMinutes: 152,
    maturityRating: "R16",
    localizedTitleEn: "The Obsidian Watchman",
    localizedTitleBn: "অবসিডিয়ান প্রহরী",
    tagline: "Justice has no badge in a city owned by the syndicate.",
    synopsisEn:
      "Across seven torrential nights, a masked forensic vigilante stalks a gothic port metropolis to dismantle an untouchable tribunal of industrialists.",
    synopsisBn:
      "সাতটি ঝড়ো রাতে এক মুখোশধারী প্রহরী বন্দরনগরীর অপরাধ সিন্ডিকেটের মুখোশ উন্মোচন করেন।",
    cinevaScore: 96,
    rawRating: 9.5,
    votesCount: "34.2K",
    voteCountNumeric: 34200,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · Sub-Bass Theatrical Mix",
    colorProcess: "35mm Bleach-Bypass & Crimson",
    negativeFormat: "35mm Anamorphic + 65mm Night Exteriors",
    country: "United States · Bangladesh",
    studio: "Obsidian Knight Works",
    studioSlug: "obsidian-knight-works",
    categorySlugs: ["top-rated-hall", "dark-vigilante-mythos", "large-format-premieres"],
    moodTags: ["vigilante", "rain", "gothic", "conspiracy", "investigation", "nocturnal"],
    filmingLocations: ["Old Port Graving Dock", "Clocktower Viaduct"],
    awardsNote: "Winner — Best Cinematography & Score, Neo-Noir Critics Guild",
    visualPreset: "monsoon-noir",
    art: {
      motif: "wings",
      option: "turrets",
      palette: {
        bg: "#050203",
        bg2: "#280408",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "kamal-hossain",
        nameEn: "Kamal Hossain",
        nameBn: "কামাল হোসেন",
      },
      {
        department: "ACTOR",
        characterName: "Commissioner Idris Mirza",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
      {
        department: "ACTOR",
        characterName: "Nyx / Selina Raza",
        billingOrder: 3,
        personSlug: "zoya-mirza",
        nameEn: "Zoya Mirza",
        nameBn: "জোয়া মির্জা",
      },
    ],
    chapters: buildDefaultChapters("The Obsidian Watchman", 152),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "WATCHMAN (V.O.): They built their towers above the floodline so they'd never hear the streets.",
        bn: "প্রহরী (কণ্ঠ): ওরা বন্যার রেখার ওপরে মিনার তুলেছে যেন রাজপথের আর্তনাদ শুনতে না হয়।",
      },
    ],
  },
  {
    id: "ser-syndicate-of-ash",
    slug: "syndicate-of-ash",
    kind: "SERIES",
    originalTitle: "Syndicate of Ash",
    originalLanguage: "bn",
    releaseYear: 2025,
    runtimeMinutes: 54,
    maturityRating: "R16",
    localizedTitleEn: "Syndicate of Ash",
    localizedTitleBn: "ছাইয়ের সিন্ডিকেট",
    tagline: "Two seasons. Twelve nights that rewrote the port underworld.",
    synopsisEn:
      "Set in the same rain-lashed port underworld as The Obsidian Watchman, a disgraced prosecutor and an underground courier wage a two-season shadow war against the Ash Dock cartel.",
    synopsisBn:
      "বন্দরনগরীর অন্ধকার জগতে এক বরখাস্ত কৌঁসুলি ও এক গোপন বার্তাবাহক দুই মৌসুম জুড়ে অ্যাশ ডক সিন্ডিকেটের বিরুদ্ধে ছায়াযুদ্ধে নামেন।",
    cinevaScore: 96,
    rawRating: 9.4,
    votesCount: "26.8K",
    voteCountNumeric: 26800,
    aspectRatio: "2.39:1 Anamorphic Series Master",
    soundMix: "Dolby Atmos · 5.1",
    colorProcess: "35mm Emulation · Obsidian & Ember LUT",
    negativeFormat: "ARRI Alexa 35 Anamorphic",
    country: "Bangladesh · United States",
    studio: "Obsidian Knight Works",
    studioSlug: "obsidian-knight-works",
    categorySlugs: ["top-rated-hall", "original-series", "dark-vigilante-mythos"],
    moodTags: ["vigilante", "conspiracy", "rain", "nocturnal", "investigation"],
    filmingLocations: ["Narayanganj Dry Dock", "Old Railway Mint"],
    awardsNote: "Winner — Best Drama Series, CINEVA Critics Poll",
    visualPreset: "monsoon-noir",
    art: {
      motif: "silhouette",
      option: "factory",
      palette: {
        bg: "#070204",
        bg2: "#31060B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "noir", nameEn: "Noir", nameBn: "নোয়ার" },
      { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
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
        characterName: "Advocate Rafiuddin",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
      {
        department: "ACTOR",
        characterName: "Mira Sen",
        billingOrder: 3,
        personSlug: "nusrat-imrose",
        nameEn: "Nusrat Imrose",
        nameBn: "নুসরাত ইমরোজ",
      },
    ],
    chapters: buildDefaultChapters("Syndicate of Ash", 54),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "MIRA: Every container on Berth 9 has two manifests—one for customs, one for the tribunal.",
        bn: "মিরা: নয় নম্বর বার্থের প্রতিটি কন্টেইনারের দুটি তালিকা—একটি কাস্টমসের, অন্যটি ট্রাইব্যুনালের।",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Season 1 · The Red Ledger",
        releaseYear: 2024,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "Berth Nine",
            titleBn: "নয় নম্বর বার্থ",
            runtimeMinutes: 56,
            synopsisEn:
              "A burned customs container exposes an unlisted gold-bullion corridor beneath the river port.",
          },
          {
            titleEn: "The Magistrate's Seal",
            titleBn: "ম্যাজিস্ট্রেটের সিলমোহর",
            runtimeMinutes: 52,
            synopsisEn:
              "Rafiuddin traces a forged judicial warrant to a shuttered shipyard foundry.",
          },
          {
            titleEn: "Nocturne in Iron",
            titleBn: "লোহার নকটার্ন",
            runtimeMinutes: 55,
            synopsisEn:
              "Mira intercepts a midnight courier train before the syndicate cleanses the archive.",
          },
          {
            titleEn: "Ashes on the Tide",
            titleBn: "জোয়ারে ছাই",
            runtimeMinutes: 58,
            synopsisEn:
              "Season finale: an all-night tribunal siege forces every alliance into the open.",
          },
        ]),
      },
      {
        seasonNumber: 2,
        titleEn: "Season 2 · Tribunal of Shadows",
        releaseYear: 2025,
        episodes: buildSeriesEpisodes(2, [
          {
            titleEn: "The Watchtower Pact",
            titleBn: "প্রহরী চুক্তি",
            runtimeMinutes: 54,
            synopsisEn:
              "Six months after the dockyard fire, a new masked enforcer seizes the northern tollgates.",
          },
          {
            titleEn: "Glass Witness",
            titleBn: "কাঁচের সাক্ষী",
            runtimeMinutes: 51,
            synopsisEn:
              "Surveillance negatives hidden inside a cinema projection booth rewrite the prime suspect list.",
          },
          {
            titleEn: "Eclipse Over Sadarghat",
            titleBn: "সদরঘাটে গ্রহণ",
            runtimeMinutes: 59,
            synopsisEn:
              "Rafiuddin and Mira risk everything in a live parliamentary broadcast showdown.",
          },
        ]),
      },
    ],
  },
  {
    id: "ser-starfall-vanguard",
    slug: "starfall-vanguard",
    kind: "SERIES",
    originalTitle: "Starfall Vanguard",
    originalLanguage: "en",
    releaseYear: 2025,
    runtimeMinutes: 50,
    maturityRating: "PG13",
    localizedTitleEn: "Starfall Vanguard",
    localizedTitleBn: "স্টারফল ভ্যানগার্ড",
    tagline: "Beyond the orbital ring, the multiverse fractures first.",
    synopsisEn:
      "Spinning directly out of Iron Eclipse, Commander Rhea Solis leads an orbital reconnaissance division investigating tachyon rifts opening across Jupiter's moons.",
    synopsisBn:
      "আয়রন ইক্লিপ্সের পরবর্তী অধ্যায়ে কমান্ডার রিয়া সোলিস বৃহস্পতির উপগ্রহে সৃষ্ট মহাজাগতিক ফাটল অনুসন্ধানে নামেন।",
    cinevaScore: 94,
    rawRating: 9.2,
    votesCount: "23.1K",
    voteCountNumeric: 23100,
    aspectRatio: "2.39:1 Large-Format Series",
    soundMix: "Dolby Atmos",
    colorProcess: "HDR10 · Cosmic Crimson Grade",
    negativeFormat: "65mm Digital Series Master",
    country: "United Kingdom · Bangladesh",
    studio: "Vanguard Mythic Studios",
    studioSlug: "vanguard-mythic-studios",
    categorySlugs: [
      "top-rated-hall",
      "original-series",
      "heroic-multiverse",
      "large-format-premieres",
    ],
    moodTags: ["heroic", "multiverse", "cosmic", "orbital", "armored", "widescreen"],
    filmingLocations: ["Virtual Volume Stage 2", "London Docklands"],
    awardsNote: "Best Visual Effects in an Episodic Series — Science Fiction Academy",
    visualPreset: "stellar-voyage",
    art: {
      motif: "eye",
      option: "crescent",
      palette: {
        bg: "#060308",
        bg2: "#360710",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
      { slug: "action", nameEn: "Action", nameBn: "অ্যাকশন" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "dev-sen",
        nameEn: "Dev Sen",
        nameBn: "দেব সেন",
      },
      {
        department: "ACTOR",
        characterName: "Commander Rhea Solis",
        billingOrder: 2,
        personSlug: "zoya-mirza",
        nameEn: "Zoya Mirza",
        nameBn: "জোয়া মির্জা",
      },
      {
        department: "ACTOR",
        characterName: "Chief Science Officer Aria Sen",
        billingOrder: 3,
        personSlug: "aupee-karim",
        nameEn: "Aupee Karim",
        nameBn: "অপি করিম",
      },
    ],
    chapters: buildDefaultChapters("Starfall Vanguard", 50),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "ARIA: That rift isn't natural—its harmonic signature matches Vanguard-00.",
        bn: "আরিয়া: এই ফাটল প্রাকৃতিক নয়—এর কম্পাঙ্ক ভ্যানগার্ড-০০-এর সাথে মিলে যাচ্ছে।",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Season 1 · Europa Anomaly",
        releaseYear: 2024,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "Zero-Hour Horizon",
            titleBn: "জিরো-আওয়ার দিগন্ত",
            runtimeMinutes: 52,
            synopsisEn:
              "A distress beacon beneath Europa's ice crust awakens dormant Vanguard armor.",
          },
          {
            titleEn: "Twin Telemetry",
            titleBn: "দ্বৈত টেলিমেট্রি",
            runtimeMinutes: 48,
            synopsisEn:
              "Two identical starships arrive from adjacent timelines carrying contradictory orders.",
          },
          {
            titleEn: "Citadel of Glass",
            titleBn: "কাঁচের দুর্গ",
            runtimeMinutes: 51,
            synopsisEn:
              "Rhea leads a zero-gravity breach to stabilize the orbital relay before collapse.",
          },
        ]),
      },
      {
        seasonNumber: 2,
        titleEn: "Season 2 · Sovereign Rift",
        releaseYear: 2025,
        episodes: buildSeriesEpisodes(2, [
          {
            titleEn: "The Seventh Bastion",
            titleBn: "সপ্তম ঘাঁটি",
            runtimeMinutes: 50,
            synopsisEn:
              "An exiled Vanguard founder returns from beyond Neptune with a warning for Earth.",
          },
          {
            titleEn: "Red Magnetosphere",
            titleBn: "লাল চৌম্বকমণ্ডল",
            runtimeMinutes: 53,
            synopsisEn:
              "Aria decodes the tachyon cipher linking every anomaly across both seasons.",
          },
          {
            titleEn: "Convergence Protocol",
            titleBn: "কনভার্জেন্স প্রোটোকল",
            runtimeMinutes: 57,
            synopsisEn:
              "Season finale: the full Vanguard fleet defends the solar gate in widescreen spectacle.",
          },
        ]),
      },
    ],
  },
  {
    id: "ser-buriganga-files",
    slug: "buriganga-files",
    kind: "SERIES",
    originalTitle: "The Buriganga Files",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 48,
    maturityRating: "PG13",
    localizedTitleEn: "The Buriganga Files",
    localizedTitleBn: "বুড়িগঙ্গা ফাইলস",
    tagline: "Eight cold cases pulled from the river silt.",
    synopsisEn:
      "Inspector Reza Chowdhury leads a river-police cold-case unit reopening decades-old maritime disappearances using forensic acoustic restoration.",
    synopsisBn:
      "ইন্সপেক্টর রেজা চৌধুরী নদী পুলিশের এক বিশেষ ইউনিটে দশক-পুরোনো রহস্যময় নিখোঁজ মামলাগুলো পুনরায় তদন্ত করেন।",
    cinevaScore: 95,
    rawRating: 9.2,
    votesCount: "19.1K",
    voteCountNumeric: 19100,
    aspectRatio: "2.00:1 Univisium",
    soundMix: "Dolby Atmos",
    colorProcess: "35mm Cinema Grain",
    negativeFormat: "Digital Cinema 4K",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
    studioSlug: "monsoon-shadow-studios",
    categorySlugs: ["top-rated-hall", "original-series"],
    moodTags: ["riverfront", "investigation", "archive", "fog", "conspiracy"],
    filmingLocations: ["Sadarghat", "Narayanganj", "Munshiganj"],
    awardsNote: "Best Lead Actor in a Series (Tariq Anam) — Delta Screen Awards",
    visualPreset: "river-thriller",
    art: {
      motif: "moon",
      option: "beams",
      palette: {
        bg: "#060405",
        bg2: "#27070B",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
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
        characterName: "Inspector Reza Chowdhury",
        billingOrder: 2,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
      {
        department: "ACTOR",
        characterName: "Sub-Inspector Masud",
        billingOrder: 3,
        personSlug: "fazle-rabbi",
        nameEn: "Fazle Rabbi",
        nameBn: "ফজলে রাব্বি",
      },
    ],
    chapters: buildDefaultChapters("The Buriganga Files", 48),
    subtitleCues: [
      {
        start: 0,
        end: 15,
        en: "CHOWDHURY: Open Evidence Locker 19—start with the ferry bell recovered in '98.",
        bn: "চৌধুরী: উনিশ নম্বর লকারটা খুলুন—৯৮ সালে উদ্ধার হওয়া লঞ্চের ঘণ্টা থেকে শুরু করব।",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Season 1 · Silt & Silver",
        releaseYear: 2024,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "The Ferryman's Watch",
            titleBn: "মাঝির ঘড়ি",
            runtimeMinutes: 49,
            synopsisEn:
              "A stopped brass pocket watch dredged from Pagla Ghat reopens a 1998 winter disappearance.",
          },
          {
            titleEn: "Lanterns in Fog",
            titleBn: "কুয়াশায় লণ্ঠন",
            runtimeMinutes: 47,
            synopsisEn:
              "Acoustic analysis of an emergency radio call reveals a second vessel beside the ferry.",
          },
          {
            titleEn: "The Dockyard Ledger",
            titleBn: "ডকইয়ার্ডের খাতা",
            runtimeMinutes: 50,
            synopsisEn:
              "Chowdhury confronts the retired harbourmaster who signed the falsified salvage report.",
          },
        ]),
      },
    ],
  },
  {
    id: "ser-signal-zero",
    slug: "signal-zero-dhaka",
    kind: "SERIES",
    originalTitle: "Signal Zero: Sector 7",
    originalLanguage: "bn",
    releaseYear: 2025,
    runtimeMinutes: 46,
    maturityRating: "PG13",
    localizedTitleEn: "Signal Zero: Sector 7",
    localizedTitleBn: "সিগন্যাল জিরো: সেক্টর ৭",
    tagline: "When the city grid drops to zero, the underground network wakes.",
    synopsisEn:
      "Acoustic cryptographer Dr. Zara Karim teams up with a rogue cyber-defense operative to stop an autonomous blackout wave spreading across South Asian transit hubs.",
    synopsisBn:
      "ধ্বনি-সংকেত বিশেষজ্ঞ ড. জারা করিম ও এক সাইবার অপারেটিভ দক্ষিণ এশিয়ার ট্রানজিট গ্রিডে ছড়িয়ে পড়া ব্ল্যাকআউট রোধে নামেন।",
    cinevaScore: 92,
    rawRating: 8.9,
    votesCount: "15.6K",
    voteCountNumeric: 15600,
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos",
    colorProcess: "Tungsten & Crimson Digital",
    negativeFormat: "Large Format Digital",
    country: "Bangladesh · Japan",
    studio: "Pacific Starlight Pictures",
    studioSlug: "pacific-starlight-pictures",
    categorySlugs: ["original-series", "heroic-multiverse"],
    moodTags: ["cybernetic", "signal", "blackout", "high-speed", "dystopian"],
    filmingLocations: ["Uttara Metro Depot", "Tejgaon"],
    awardsNote: "Official Selection — International Episodic Sci-Fi Showcase",
    visualPreset: "cyber-acoustic",
    art: {
      motif: "screen",
      option: "rails",
      palette: {
        bg: "#050608",
        bg2: "#2C060C",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
      { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "elena-rostova",
        nameEn: "Elena Rostova",
        nameBn: "এলেনা রোস্তোভা",
      },
      {
        department: "ACTOR",
        characterName: "Dr. Zara Karim",
        billingOrder: 2,
        personSlug: "nusrat-imrose",
        nameEn: "Nusrat Imrose",
        nameBn: "নুসরাত ইমরোজ",
      },
      {
        department: "ACTOR",
        characterName: "Agent Ira Sen",
        billingOrder: 3,
        personSlug: "zoya-mirza",
        nameEn: "Zoya Mirza",
        nameBn: "জোয়া মির্জা",
      },
    ],
    chapters: buildDefaultChapters("Signal Zero: Sector 7", 46),
    subtitleCues: [
      {
        start: 0,
        end: 15,
        en: "ZARA: Sector 7 substation is offline—switch the metro array to analog relay!",
        bn: "জারা: সেক্টর ৭ সাবস্টেশন বন্ধ—মেট্রো নেটওয়ার্ক অ্যানালগ রিলেতে নিয়ে যাও!",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Season 1 · Carrier Wave",
        releaseYear: 2024,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "432 Hertz",
            titleBn: "৪৩২ হার্জ",
            runtimeMinutes: 46,
            synopsisEn:
              "A 90-second power drop across Dhaka's metro rail conceals an encrypted acoustic payload.",
          },
          {
            titleEn: "Substation Ghost",
            titleBn: "সাবস্টেশনের ছায়া",
            runtimeMinutes: 45,
            synopsisEn: "Zara and Ira trace the rogue packet to an abandoned telegraph bunker.",
          },
          {
            titleEn: "Red Grid",
            titleBn: "রেড গ্রিড",
            runtimeMinutes: 48,
            synopsisEn: "The team races to isolate the coastal cable landing before midnight.",
          },
        ]),
      },
      {
        seasonNumber: 2,
        titleEn: "Season 2 · Zero Protocol",
        releaseYear: 2025,
        episodes: buildSeriesEpisodes(2, [
          {
            titleEn: "Silent Viaduct",
            titleBn: "নীরব উড়ালসেতু",
            runtimeMinutes: 47,
            synopsisEn:
              "An orbital satellite handshake links the blackout code to a wider global syndicate.",
          },
          {
            titleEn: "Analog Heartbeat",
            titleBn: "অ্যানালগ স্পন্দন",
            runtimeMinutes: 49,
            synopsisEn:
              "Using 1970s copper switchboards, Zara builds an unhackable counter-network.",
          },
        ]),
      },
    ],
  },
  {
    id: "ser-curzon-chronicles",
    slug: "curzon-chronicles",
    kind: "SERIES",
    originalTitle: "The Curzon Chronicles",
    originalLanguage: "bn",
    releaseYear: 2024,
    runtimeMinutes: 52,
    maturityRating: "PG",
    localizedTitleEn: "The Curzon Chronicles",
    localizedTitleBn: "কার্জন ক্রনিকলস",
    tagline: "A century of scholars, ciphers, and secret observatories.",
    synopsisEn:
      "Spanning 1924 and 2024 in parallel timelines, Professor Nadia Sen unravels an astronomical society's century-old archive hidden beneath Dhaka's red-brick domes.",
    synopsisBn:
      "১৯২৪ ও ২০২৪ সালের সমান্তরাল সময়ে অধ্যাপক নাদিয়া সেন কার্জন হলের গম্বুজের নিচে লুকানো এক শতবর্ষী জ্যোতির্বিজ্ঞান সমাজের রহস্য উন্মোচন করেন।",
    cinevaScore: 91,
    rawRating: 8.8,
    votesCount: "11.2K",
    voteCountNumeric: 11200,
    aspectRatio: "1.85:1 Spherical",
    soundMix: "5.1 Surround",
    colorProcess: "Warm Ivory & Crimson Archival LUT",
    negativeFormat: "35mm & Digital Hybrid",
    country: "Bangladesh",
    studio: "Pacific Starlight Pictures",
    studioSlug: "pacific-starlight-pictures",
    categorySlugs: ["original-series"],
    moodTags: ["cipher", "architecture", "archive", "heritage", "investigation"],
    filmingLocations: ["Curzon Hall", "Old Dhaka Library"],
    awardsNote: "Best Production Design in a Limited Series",
    visualPreset: "curzon-mystery",
    art: {
      motif: "door",
      option: "turrets",
      palette: {
        bg: "#090405",
        bg2: "#2E080C",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
    availability: {
      streamAllowed: true,
      downloadAllowed: false,
      metadataAllowed: true,
      badgeKind: "stream_allowed",
    },
    genres: [
      { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
      { slug: "drama", nameEn: "Drama", nameBn: "নাটক" },
    ],
    credits: [
      {
        department: "DIRECTOR",
        billingOrder: 1,
        personSlug: "kamal-hossain",
        nameEn: "Kamal Hossain",
        nameBn: "কামাল হোসেন",
      },
      {
        department: "ACTOR",
        characterName: "Prof. Nadia Sen",
        billingOrder: 2,
        personSlug: "aupee-karim",
        nameEn: "Aupee Karim",
        nameBn: "অপি করিম",
      },
      {
        department: "ACTOR",
        characterName: "Dean Habibur Rahman (1924)",
        billingOrder: 3,
        personSlug: "tariq-anam",
        nameEn: "Tariq Anam",
        nameBn: "তারিক আনাম",
      },
    ],
    chapters: buildDefaultChapters("The Curzon Chronicles", 52),
    subtitleCues: [
      {
        start: 0,
        end: 16,
        en: "NADIA: Two brass astrolabes forged a hundred years apart—and both point to the same meridian.",
        bn: "নাদিয়া: একশো বছরের ব্যবধানে গড়া দুটি পিতলের অ্যাস্ট্রোলেব—অথচ দুটিই একই দ্রাঘিমায় স্থির।",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Limited Series · Six Chapters",
        releaseYear: 2024,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "The 1924 Transit",
            titleBn: "১৯২৪-এর পরিক্রমা",
            runtimeMinutes: 53,
            synopsisEn:
              "A sealed copper cylinder inside the west dome reveals an unpublished solar-eclipse notebook.",
          },
          {
            titleEn: "The Eleventh Keystone",
            titleBn: "এগারোতম খিলানপাথর",
            runtimeMinutes: 51,
            synopsisEn: "Nadia reconstructs the acoustic geometry of the lecture rotunda.",
          },
          {
            titleEn: "Meridian of Light",
            titleBn: "আলোর দ্রাঘিমা",
            runtimeMinutes: 54,
            synopsisEn:
              "Series finale: past and present converge as the equinox beam strikes the vault floor.",
          },
        ]),
      },
    ],
  },
  {
    id: "ser-delta-odyssey",
    slug: "delta-odyssey",
    kind: "SERIES",
    originalTitle: "Delta Odyssey: Living Rivers",
    originalLanguage: "bn",
    releaseYear: 2023,
    runtimeMinutes: 44,
    maturityRating: "U",
    localizedTitleEn: "Delta Odyssey: Living Rivers",
    localizedTitleBn: "বদ্বীপ ওডিসি: জীবন্ত নদী",
    tagline: "Seven hundred rivers filmed in 4K from monsoon swell to winter mist.",
    synopsisEn:
      "Narrated with binaural hydrophone soundscapes, this open-access documentary series journeys from Himalayan meltwaters through the braided Meghna estuary to the Bay of Bengal.",
    synopsisBn:
      "হিমালয়ের বরফগলা জল থেকে মেঘনার মোহনা হয়ে বঙ্গোপসাগর পর্যন্ত সাতশো নদীর ৪কে প্রামাণ্য সিরিজ।",
    cinevaScore: 93,
    rawRating: 9.1,
    votesCount: "12.4K",
    voteCountNumeric: 12400,
    aspectRatio: "1.85:1 4K Archival Series",
    soundMix: "Dolby Atmos Nature Field Mix",
    colorProcess: "4K Natural Silver & Emerald",
    negativeFormat: "Large Format 4K Open Archive",
    country: "Bangladesh (Open Archive)",
    studio: "CINEVA Public Domain Vault",
    studioSlug: "cineva-public-domain-vault",
    categorySlugs: ["original-series", "public-domain-vault"],
    moodTags: ["river", "heritage", "meditative", "soundscape", "expedition"],
    filmingLocations: ["Padma Confluence", "Sundarbans", "Sylhet Haor Basin"],
    awardsNote: "Open Educational & Public-Access Documentary Citation",
    visualPreset: "delta-tide",
    art: {
      motif: "fields",
      option: "crescent",
      palette: {
        bg: "#060606",
        bg2: "#24090A",
        ink: "#000000",
        accent: "#E50914",
        light: "#FEF9EF",
      },
    },
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
        personSlug: "rafiq-azad",
        nameEn: "Rafiq Azad",
        nameBn: "রফিক আজাদ",
      },
      {
        department: "ACTOR",
        characterName: "Narrator",
        billingOrder: 2,
        personSlug: "aupee-karim",
        nameEn: "Aupee Karim",
        nameBn: "অপি করিম",
      },
    ],
    chapters: buildDefaultChapters("Delta Odyssey", 44),
    subtitleCues: [
      {
        start: 0,
        end: 18,
        en: "NARRATOR: Before borders had names, silt and monsoon wrote the map of Bengal.",
        bn: "বর্ণনাকারী: সীমানার নামকরণের বহু আগে পলি আর বর্ষাই এঁকেছিল বাংলার মানচিত্র।",
      },
    ],
    seasons: [
      {
        seasonNumber: 1,
        titleEn: "Season 1 · Tides of the Estuary",
        releaseYear: 2023,
        episodes: buildSeriesEpisodes(1, [
          {
            titleEn: "Monsoon Arrival",
            titleBn: "বর্ষার আগমন",
            runtimeMinutes: 45,
            synopsisEn:
              "FirstJune cloudbanks transform dry sandbars into inland seas within seventy-two hours.",
          },
          {
            titleEn: "Floating Markets of Barishal",
            titleBn: "বরিশালের ভাসমান হাট",
            runtimeMinutes: 43,
            synopsisEn: "Dawn timber and guava boats converge across tidal canals.",
          },
          {
            titleEn: "Mangrove Choir",
            titleBn: "ম্যানগ্রোভের ঐকতান",
            runtimeMinutes: 44,
            synopsisEn:
              "Submerged hydrophones capture dolphin clicks and tidal currents at Hiron Point.",
          },
        ]),
      },
    ],
  },
];

export const CINEVA_COLLECTIONS: readonly CinevaCuratedCollection[] = [
  {
    id: "col-monsoon-noir-archive",
    slug: "monsoon-noir-archive",
    titleEn: "Monsoon Noir & Archival Vault",
    titleBn: "বর্ষা নোয়ার ও আর্কাইভ ভল্ট",
    eyebrow: "Signature Collection · 01",
    description:
      "Rain-swept mysteries, riverfront investigations, and nocturnal cinema forged across Old Dhaka and the Bengal delta.",
    filmSlugs: [
      "the-last-monsoon",
      "syndicate-of-ash",
      "buriganga-files",
      "neon-bhasha",
      "shadows-over-buriganga",
      "midnight-at-curzon-hall",
      "dhaka-nocturne",
    ],
  },
  {
    id: "col-heroic-and-vigilante",
    slug: "heroic-and-vigilante-sagas",
    titleEn: "Heroic Multiverse & Dark Vigilante Sagas",
    titleBn: "হিরোইক মাল্টিভার্স ও ডার্ক ভিজিল্যান্টে গাথা",
    eyebrow: "Signature Collection · 02",
    description:
      "Armored orbital guardians, tachyon rift expeditions, and masked rooftop watchmen across Vanguard Mythic Studios and Obsidian Knight Works.",
    filmSlugs: [
      "the-obsidian-watchman",
      "iron-eclipse",
      "syndicate-of-ash",
      "starfall-vanguard",
      "signal-zero-dhaka",
    ],
  },
  {
    id: "col-orbital-frontiers",
    slug: "orbital-frontiers",
    titleEn: "Orbital Signals & Deep-Horizon Sci-Fi",
    titleBn: "মহাজাগতিক সংকেত ও কল্পবিজ্ঞান",
    eyebrow: "Signature Collection · 03",
    description:
      "Hard-science expeditions, subterranean acoustic relays, and deep-ocean observatories framed in 2.39:1 anamorphic widescreen.",
    filmSlugs: [
      "voyage-beyond-stars",
      "starfall-vanguard",
      "iron-eclipse",
      "neon-bhasha",
      "the-sunken-observatory",
      "signal-zero-dhaka",
    ],
  },
  {
    id: "col-public-domain-masters",
    slug: "public-domain-masters",
    titleEn: "4K Public-Domain World Cinema Vault",
    titleBn: "৪কে পাবলিক ডোমেইন বিশ্ব চলচ্চিত্র ভল্ট",
    eyebrow: "Signature Collection · 04",
    description:
      "Pre-1929 gothic and suspense milestones newly scanned with bespoke orchestral scores and verified open distribution rights.",
    filmSlugs: [
      "the-phantom-carriage-1921",
      "the-lodger-1927",
      "echoes-of-the-delta",
      "delta-odyssey",
      "symphony-of-the-loom",
    ],
  },
  {
    id: "col-midnight-thrillers",
    slug: "midnight-thrillers",
    titleEn: "After-Hours Suspense & Night Trains",
    titleBn: "মধ্যরাতের থ্রিলার ও রাত্রিকালীন যাত্রা",
    eyebrow: "Signature Collection · 05",
    description:
      "Locked sleeper carriages, blackout observatories, fogbound barges, and all-night radio frequencies.",
    filmSlugs: [
      "crimson-express",
      "the-obsidian-watchman",
      "shadows-over-buriganga",
      "midnight-at-curzon-hall",
      "dhaka-nocturne",
    ],
  },
];

export function getCinevaFilmBySlug(slug: string): CinevaDatabaseFilm | null {
  return CINEVA_DATABASE_FILMS.find((f) => f.slug === slug) ?? null;
}

export function getCinevaStudioBySlug(slug: string): CinevaStudioHub | null {
  return CINEVA_STUDIOS.find((s) => s.slug === slug) ?? null;
}

export function getCinevaSpecialCategoryBySlug(slug: string): CinevaSpecialCategory | null {
  return CINEVA_SPECIAL_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export function getCinevaEpisode(
  film: CinevaDatabaseFilm,
  seasonNumber?: number | null,
  episodeNumber?: number | null,
): CinevaEpisode | null {
  if (!film.seasons || film.seasons.length === 0) return null;
  const sNum = seasonNumber && Number.isFinite(seasonNumber) ? seasonNumber : 1;
  const eNum = episodeNumber && Number.isFinite(episodeNumber) ? episodeNumber : 1;
  const season = film.seasons.find((s) => s.seasonNumber === sNum) ?? film.seasons[0];
  if (!season) return null;
  return season.episodes.find((ep) => ep.episodeNumber === eNum) ?? season.episodes[0] ?? null;
}

const CATEGORY_TITLE_MAP: Readonly<Record<string, string>> = Object.fromEntries(
  CINEVA_SPECIAL_CATEGORIES.map((c) => [c.slug, c.titleEn]),
);

export function toRecommendationCandidate(film: CinevaDatabaseFilm): RecommendationCandidate {
  const genreNames: Record<string, string> = {};
  for (const g of film.genres) {
    genreNames[g.slug] = g.nameEn;
  }
  const directorNames: Record<string, string> = {};
  const castNames: Record<string, string> = {};
  for (const c of film.credits) {
    if (c.department === "DIRECTOR") {
      directorNames[c.personSlug] = c.nameEn;
    } else if (c.department === "ACTOR") {
      castNames[c.personSlug] = c.nameEn;
    }
  }

  return {
    slug: film.slug,
    kind: film.kind,
    titleEn: film.localizedTitleEn,
    releaseYear: film.releaseYear,
    runtimeMinutes: film.runtimeMinutes,
    originalLanguage: film.originalLanguage,
    studioSlug: film.studioSlug,
    studioName: film.studio,
    genreSlugs: film.genres.map((g) => g.slug),
    genreNames,
    directorSlugs: film.credits.filter((c) => c.department === "DIRECTOR").map((c) => c.personSlug),
    directorNames,
    castSlugs: film.credits.filter((c) => c.department === "ACTOR").map((c) => c.personSlug),
    castNames,
    categorySlugs: film.categorySlugs,
    categoryNames: CATEGORY_TITLE_MAP,
    moodTags: film.moodTags,
    rawRating: film.rawRating,
    voteCount: film.voteCountNumeric,
    streamAllowed: film.availability.streamAllowed,
  };
}

const CINEVA_RECOMMENDATION_POOL: readonly RecommendationCandidate[] =
  CINEVA_DATABASE_FILMS.map(toRecommendationCandidate);

const CINEVA_TOP_RATED_ENTRIES: readonly RankedTopRatedEntry[] = rankTopRatedCandidates(
  CINEVA_RECOMMENDATION_POOL,
  5000,
);

const CINEVA_TOP_RATED_MAP: ReadonlyMap<string, RankedTopRatedEntry> = new Map(
  CINEVA_TOP_RATED_ENTRIES.map((entry) => [entry.slug, entry]),
);

export function getCinevaTopRatedMap(): ReadonlyMap<string, RankedTopRatedEntry> {
  return CINEVA_TOP_RATED_MAP;
}

export function getCinevaTopRatedLeaderboard(limit = 10): Array<{
  film: CinevaDatabaseFilm;
  ranking: RankedTopRatedEntry;
}> {
  return CINEVA_TOP_RATED_ENTRIES.slice(0, limit)
    .map((ranking) => {
      const film = getCinevaFilmBySlug(ranking.slug);
      return film ? { film, ranking } : null;
    })
    .filter((x): x is { film: CinevaDatabaseFilm; ranking: RankedTopRatedEntry } => x !== null);
}

export function getCinevaSimilarTitles(
  slug: string,
  limit = 6,
): Array<{ film: CinevaDatabaseFilm; match: RecommendationMatch }> {
  const target = CINEVA_RECOMMENDATION_POOL.find((c) => c.slug === slug);
  if (!target) return [];
  const matches = recommendSimilarTitles(target, CINEVA_RECOMMENDATION_POOL, { limit });
  return matches
    .map((match) => {
      const film = getCinevaFilmBySlug(match.slug);
      return film ? { film, match } : null;
    })
    .filter((x): x is { film: CinevaDatabaseFilm; match: RecommendationMatch } => x !== null);
}

export function getCinevaPersonalizedRecommendations(
  seedSlugs: readonly string[],
  limit = 6,
): Array<{ film: CinevaDatabaseFilm; match: RecommendationMatch }> {
  const matches = recommendPersonalizedForSeeds(seedSlugs, CINEVA_RECOMMENDATION_POOL, { limit });
  return matches
    .map((match) => {
      const film = getCinevaFilmBySlug(match.slug);
      return film ? { film, match } : null;
    })
    .filter((x): x is { film: CinevaDatabaseFilm; match: RecommendationMatch } => x !== null);
}

export interface CinevaCatalogueFilterInput {
  query?: string;
  kind?: "ALL" | TitleKind;
  genre?: string;
  director?: string;
  cast?: string;
  category?: string;
  studio?: string;
  language?: string;
  maturityRating?: string;
  access?: "all" | "stream" | "download";
  sort?: CatalogueSort;
}

export function queryCinevaCatalogue(input: CinevaCatalogueFilterInput = {}): CinevaDatabaseFilm[] {
  const q = input.query?.trim().toLowerCase() ?? "";
  const topMap = getCinevaTopRatedMap();

  const filtered = CINEVA_DATABASE_FILMS.filter((film) => {
    if (input.kind && input.kind !== "ALL" && film.kind !== input.kind) {
      return false;
    }
    if (input.genre && input.genre !== "all") {
      if (!film.genres.some((g) => g.slug === input.genre)) return false;
    }
    if (input.director && input.director !== "all") {
      if (
        !film.credits.some((c) => c.department === "DIRECTOR" && c.personSlug === input.director)
      ) {
        return false;
      }
    }
    if (input.cast && input.cast !== "all") {
      if (!film.credits.some((c) => c.department === "ACTOR" && c.personSlug === input.cast)) {
        return false;
      }
    }
    if (input.category && input.category !== "all") {
      if (!film.categorySlugs.includes(input.category)) return false;
    }
    if (input.studio && input.studio !== "all") {
      if (film.studioSlug !== input.studio) return false;
    }
    if (input.language && input.language !== "all") {
      if (film.originalLanguage !== input.language) return false;
    }
    if (input.maturityRating && input.maturityRating !== "all") {
      if (film.maturityRating !== input.maturityRating) return false;
    }
    if (input.access === "stream" && !film.availability.streamAllowed) {
      return false;
    }
    if (input.access === "download" && !film.availability.downloadAllowed) {
      return false;
    }
    if (q.length > 0) {
      const haystack = [
        film.localizedTitleEn,
        film.localizedTitleBn,
        film.originalTitle,
        film.tagline,
        film.synopsisEn,
        film.studio,
        film.country,
        ...film.genres.map((g) => g.nameEn),
        ...film.credits.map((c) => c.nameEn),
        ...film.moodTags,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const sortMode: CatalogueSort = input.sort ?? "featured";
  filtered.sort((a, b) => {
    switch (sortMode) {
      case "top_rated": {
        const scoreA = topMap.get(a.slug)?.bayesianScore ?? a.rawRating;
        const scoreB = topMap.get(b.slug)?.bayesianScore ?? b.rawRating;
        if (scoreB !== scoreA) return scoreB - scoreA;
        return b.voteCountNumeric - a.voteCountNumeric;
      }
      case "trending": {
        const trendA = a.voteCountNumeric * (a.releaseYear >= 2024 ? 1.35 : 1);
        const trendB = b.voteCountNumeric * (b.releaseYear >= 2024 ? 1.35 : 1);
        return trendB - trendA;
      }
      case "newest":
        return b.releaseYear - a.releaseYear || b.cinevaScore - a.cinevaScore;
      case "classic":
        return a.releaseYear - b.releaseYear || b.cinevaScore - a.cinevaScore;
      case "runtime_desc":
        return b.runtimeMinutes - a.runtimeMinutes;
      case "runtime_asc":
        return a.runtimeMinutes - b.runtimeMinutes;
      case "title_asc":
        return a.localizedTitleEn.localeCompare(b.localizedTitleEn);
      case "featured":
      default:
        return (a.rank ?? 99) - (b.rank ?? 99) || b.cinevaScore - a.cinevaScore;
    }
  });

  return filtered;
}
