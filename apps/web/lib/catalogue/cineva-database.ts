import type { MaturityRating } from "@movie/contracts";
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

export interface CinevaDatabaseFilm {
  id: string;
  slug: string;
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
  cinevaScore: number;
  votesCount: string;
  aspectRatio: string;
  soundMix: string;
  colorProcess: string;
  negativeFormat: string;
  country: string;
  studio: string;
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
  { slug: "sci-fi", nameEn: "Sci-Fi", nameBn: "কল্পবিজ্ঞান" },
  { slug: "thriller", nameEn: "Thriller", nameBn: "থ্রিলার" },
  { slug: "mystery", nameEn: "Mystery", nameBn: "রহস্য" },
  { slug: "documentary", nameEn: "Documentary", nameBn: "প্রামাণ্যচিত্র" },
  { slug: "classic", nameEn: "Classic", nameBn: "ধ্রুপদী" },
];

export const CINEVA_PEOPLE: readonly CinevaPersonProfile[] = [
  {
    id: "per-amina-rahman",
    slug: "amina-rahman",
    nameEn: "Amina Rahman",
    nameBn: "আমিনা রহমান",
    primaryRole: "Director & Screenwriter",
    bornYear: 1984,
    origin: "Dhaka, Bangladesh",
    bio: "Contemporary Dhaka auteur celebrated for atmospheric riverine noir, tactile 35mm shadow geometry, and archival acoustic storytelling across the Bengal delta.",
  },
  {
    id: "per-tariq-anam",
    slug: "tariq-anam",
    nameEn: "Tariq Anam",
    nameBn: "তারিক আনাম",
    primaryRole: "Lead Actor",
    bornYear: 1959,
    origin: "Dhaka, Bangladesh",
    bio: "Veteran stage and screen performer renowned for restrained, razor-edged portrayals of investigators, archivists, and morally conflicted patriarchs.",
  },
  {
    id: "per-nusrat-imrose",
    slug: "nusrat-imrose",
    nameEn: "Nusrat Imrose",
    nameBn: "নুসরাত ইমরোজ",
    primaryRole: "Lead Actor",
    bornYear: 1989,
    origin: "Rajshahi, Bangladesh",
    bio: "Acclaimed dramatic lead known for cyber-noir thrillers and intimate chamber mysteries anchored in bilingual performance.",
  },
  {
    id: "per-kamal-hossain",
    slug: "kamal-hossain",
    nameEn: "Kamal Hossain",
    nameBn: "কামাল হোসেন",
    primaryRole: "Director",
    bornYear: 1978,
    origin: "Chattogram, Bangladesh",
    bio: "Maritime thriller and speculative sci-fi filmmaker combining widescreen anamorphic framing with practical industrial production design.",
  },
  {
    id: "per-elena-rostova",
    slug: "elena-rostova",
    nameEn: "Elena Rostova",
    nameBn: "এলেনা রোস্তোভা",
    primaryRole: "Director",
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
    bio: "Character actor recognized for nocturnal crime dramas and historical mysteries.",
  },
  {
    id: "per-aupee-karim",
    slug: "aupee-karim",
    nameEn: "Aupee Karim",
    nameBn: "অপি করিম",
    primaryRole: "Actor & Architect",
    bornYear: 1979,
    origin: "Dhaka, Bangladesh",
    bio: "Screen performer and architectural scholar bringing crisp intellectual intensity to mystery and ensemble cinema.",
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

export const CINEVA_DATABASE_FILMS: readonly CinevaDatabaseFilm[] = [
  {
    id: "fix-the-last-monsoon",
    slug: "the-last-monsoon",
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
    votesCount: "18.4K",
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · 5.1 Surround",
    colorProcess: "35mm Cinema Color · Crimson DI",
    negativeFormat: "Kodak Vision3 500T 5219",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
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
    votesCount: "14.1K",
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · Discrete Binaural Mix",
    colorProcess: "Digital Anamorphic · Ruby & Tungsten LUT",
    negativeFormat: "ARRI Alexa Mini LF · Atlas Orion",
    country: "Bangladesh",
    studio: "Subterranean Signal Works",
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
    votesCount: "11.9K",
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "5.1 Theatrical Surround",
    colorProcess: "35mm Cinema Color",
    negativeFormat: "35mm 4-Perf Anamorphic",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
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
    votesCount: "22.7K",
    aspectRatio: "2.39:1 IMAX Widescreen",
    soundMix: "Dolby Atmos · 7.1 Theatrical",
    colorProcess: "65mm Large Format Digital Master",
    negativeFormat: "65mm Digital Cinema Master",
    country: "United Kingdom · Bangladesh",
    studio: "Meridian Orbital Pictures",
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
    votesCount: "12.8K",
    aspectRatio: "1.85:1 Spherical",
    soundMix: "5.1 Surround",
    colorProcess: "35mm Crimson & Ochre Print",
    negativeFormat: "35mm Spherical",
    country: "Bangladesh",
    studio: "Curzon Archival Collective",
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
    votesCount: "9.3K",
    aspectRatio: "1.85:1 Widescreen",
    soundMix: "Quadraphonic Field Recording · Stereo",
    colorProcess: "16mm Ektachrome Scan · 4K Restoration",
    negativeFormat: "Super 16mm",
    country: "Bangladesh",
    studio: "Shitalakshya Field Archive",
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
    votesCount: "7.6K",
    aspectRatio: "1.85:1 Widescreen",
    soundMix: "24-bit Acoustic Master",
    colorProcess: "Silver-Halide & Warm Ivory Grade",
    negativeFormat: "35mm 3-Perf",
    country: "Bangladesh",
    studio: "Shitalakshya Field Archive",
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
    votesCount: "16.2K",
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos · 5.1",
    colorProcess: "35mm Cinema Color",
    negativeFormat: "35mm Anamorphic",
    country: "Bangladesh · United Kingdom",
    studio: "Meridian Orbital Pictures",
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
    votesCount: "10.4K",
    aspectRatio: "2.39:1 Anamorphic",
    soundMix: "Dolby Atmos",
    colorProcess: "Digital Cinema 4K",
    negativeFormat: "Large Format Digital",
    country: "United Kingdom · Bangladesh",
    studio: "Meridian Orbital Pictures",
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
    votesCount: "13.5K",
    aspectRatio: "1.85:1 Spherical",
    soundMix: "5.1 Jazz & Room-Tone Mix",
    colorProcess: "35mm Warm Tungsten & Crimson",
    negativeFormat: "35mm 3-Perf",
    country: "Bangladesh",
    studio: "Monsoon Shadow Studios",
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
    votesCount: "31.0K",
    aspectRatio: "1.33:1 Silent Full Aperture",
    soundMix: "2024 Chamber Strings & Pipe Organ Score",
    colorProcess: "Silver-Halide Tinted Nitrate Restoration",
    negativeFormat: "35mm Orthochromatic Nitrate (Public Domain)",
    country: "Sweden (Public Domain)",
    studio: "CINEVA Public Domain Vault",
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
    votesCount: "19.8K",
    aspectRatio: "1.33:1 Academy",
    soundMix: "Restored Symphonic Suspense Score",
    colorProcess: "Amber & Crimson Tinted Archival Print",
    negativeFormat: "35mm Public Domain Archival Print",
    country: "United Kingdom (Public Domain)",
    studio: "CINEVA Public Domain Vault",
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
      "neon-bhasha",
      "shadows-over-buriganga",
      "echoes-of-the-delta",
      "midnight-at-curzon-hall",
      "voyage-beyond-stars",
      "symphony-of-the-loom",
    ],
  },
  {
    id: "col-orbital-frontiers",
    slug: "orbital-frontiers",
    titleEn: "Orbital Signals & Deep-Horizon Sci-Fi",
    titleBn: "মহাজাগতিক সংকেত ও কল্পবিজ্ঞান",
    eyebrow: "Signature Collection · 02",
    description:
      "Hard-science expeditions, subterranean acoustic relays, and deep-ocean observatories framed in 2.39:1 anamorphic widescreen.",
    filmSlugs: ["voyage-beyond-stars", "neon-bhasha", "the-sunken-observatory", "crimson-express"],
  },
  {
    id: "col-public-domain-masters",
    slug: "public-domain-masters",
    titleEn: "4K Public-Domain World Cinema Vault",
    titleBn: "৪কে পাবলিক ডোমেইন বিশ্ব চলচ্চিত্র ভল্ট",
    eyebrow: "Signature Collection · 03",
    description:
      "Pre-1929 gothic and suspense milestones newly scanned with bespoke orchestral scores and verified open distribution rights.",
    filmSlugs: [
      "the-phantom-carriage-1921",
      "the-lodger-1927",
      "echoes-of-the-delta",
      "symphony-of-the-loom",
    ],
  },
  {
    id: "col-midnight-thrillers",
    slug: "midnight-thrillers",
    titleEn: "After-Hours Suspense & Night Trains",
    titleBn: "মধ্যরাতের থ্রিলার ও রাত্রিকালীন যাত্রা",
    eyebrow: "Signature Collection · 04",
    description:
      "Locked sleeper carriages, blackout observatories, fogbound barges, and all-night radio frequencies.",
    filmSlugs: [
      "crimson-express",
      "shadows-over-buriganga",
      "midnight-at-curzon-hall",
      "dhaka-nocturne",
    ],
  },
];

export function getCinevaFilmBySlug(slug: string): CinevaDatabaseFilm | null {
  return CINEVA_DATABASE_FILMS.find((f) => f.slug === slug) ?? null;
}
