# CINEMATIC GRAPHITE
## Movie Discovery & Streaming Platform — Product UI/UX and Design System

**Version:** 1.0  
**Prepared:** 6 November 2026  
**Companion specification:** `movie-platform-master-blueprint-v3.md`  
**Scope:** Original design system for a premium, lawful movie-discovery and authorized streaming product. This is a benchmark-informed design direction, not a reproduction of Netflix, Apple TV, MUBI, or any other service.

---

# 1. Design vision

Create a movie product that feels like a premium film journal and a high-performance streaming service in one. The interface should be visually quiet enough for film artwork to dominate, but structured enough that the user can discover, understand, save, and play a title without friction.

### Product experience principles

1. **Artwork first:** title art is the strongest visual cue; UI chrome is restrained.
2. **Immediate playback:** the path to Play/Resume is obvious and fast.
3. **Discovery with intent:** combine personalized shelves, curated collections, search, and filters.
4. **Editorial taste:** collections and director/cast pathways make exploration richer than a poster grid.
5. **Trustworthy availability:** availability, quality, subtitles, audio, and download actions are shown only when verified.
6. **Personal without creepiness:** profiles control history and preferences; recommendations remain explainable and resettable.
7. **Accessible cinematic UI:** dark themes still require readable contrast, strong focus, keyboard support, captions, and reduced motion.
8. **Original identity:** borrow UX principles, not competitor layouts, names, logos, images, or copy.

### Research synthesis

- Netflix publicly describes personalization at the row, title-selection, and item-order level; use this to design thoughtful home ranking rather than a static set of shelves. [Source](https://help.netflix.com/en/node/100639/)
- Apple's video HIG emphasizes continuity and avoiding unnecessary barriers before expected playback/resume. [Source](https://developer.apple.com/design/human-interface-guidelines/playing-video)
- MUBI is a useful editorial-curation benchmark: curated collections and deeper paths through filmographies can complement algorithmic discovery. Treat this as a product heuristic, not a claim about its internal design system.
- WCAG 2.2 is the accessibility baseline: contrast, visible focus, focus not obscured, target size, resizing, and accessible authentication. [Source](https://www.w3.org/TR/WCAG22/)

---

# 2. Brand system

## 2.1 Working direction

**Design codename:** Cinematic Graphite. The public brand name, logo, and identity system require separate brand approval.

| Attribute | Direction | Avoid |
|---|---|---|
| Mood | Cinematic, editorial, immersive | Noisy, gamer-like, neon-heavy |
| Personality | Confident, thoughtful, curated | Overly playful or corporate SaaS |
| Visual weight | Large imagery, careful negative space | Too many cards/badges per viewport |
| Motion | Subtle and purposeful | Constant movement and parallax |
| Language | Clear, human, concise | Fake hype, exaggerated ratings |
| Trust | Transparent rights-aware availability | Fake download buttons or false quality claims |

## 2.2 Logo and mark direction

Create an original wordmark and compact symbol. Possible visual territories to explore in Figma:

- A minimal aperture / frame motif.
- A refined play-window geometry.
- A monogram built from a film-frame corner or aspect-ratio crop.

Do not use a literal film reel cliché unless it has a strong original interpretation. The symbol must work at 16 px favicon size, 24 px navigation size, and large hero/marketing usage. Logo clear space = at least half the mark height. Maintain light-on-dark and dark-on-light variants even if the product defaults to dark mode.

## 2.3 Brand voice

- Concise and informative.
- Avoid slang that becomes hard to localize.
- Use “Play”, “Resume”, “Save”, “Details”, “Audio & subtitles”.
- Do not use false scarcity or false urgency.
- State access restrictions in plain language (“Not available in your region”) without revealing private contractual information.

---

# 3. Color system

## 3.1 Foundation palette

| Token | Hex | Usage |
|---|---|---|
| Graphite 950 | `#080A0D` | Global canvas |
| Graphite 900 | `#0D1116` | Raised background |
| Graphite 850 | `#12171E` | Card/panel base |
| Graphite 800 | `#181F28` | Elevated menus and cards |
| Graphite 750 | `#222B36` | Hover/selected surface |
| Graphite 700 | `#2B3542` | Default border |
| Graphite 600 | `#425063` | Strong border |
| Ivory 50 | `#F4F6F8` | Primary text |
| Slate 200 | `#B2BBC7` | Secondary text |
| Slate 400 | `#818D9B` | Muted text |
| Cinema Gold | `#D8B36A` | Primary accent |
| Gold Hover | `#E8C77F` | Accent hover |
| Gold Pressed | `#B9924D` | Accent pressed |
| Success | `#49C69A` | Success/available |
| Warning | `#F0B85F` | Warning/expiring |
| Danger | `#F16B73` | Error/destructive |
| Info | `#73A9F4` | Information |

## 3.2 Usage rules

- Gold is a signal color, not a background color for every button, badge, border, and title.
- Primary Play action may use a light surface with dark text for strong contrast; reserve gold for the brand accent and selected states.
- Keep body text at high contrast. Do not use muted gray for essential metadata.
- Error, warning, and success must include text/icon, never color alone.
- Artwork may contain bright colors; protect overlaid text with a tested bottom/side gradient.
- Validate color combinations with WCAG contrast tools before release. Color tokens do not automatically guarantee contrast in all pairings.

## 3.3 Semantic color roles

```css
:root {
  color-scheme: dark;
  --color-canvas: #080A0D;
  --color-canvas-raised: #0D1116;
  --color-surface: #12171E;
  --color-surface-raised: #181F28;
  --color-surface-hover: #222B36;
  --color-border: #2B3542;
  --color-border-strong: #425063;
  --color-text-primary: #F4F6F8;
  --color-text-secondary: #B2BBC7;
  --color-text-muted: #818D9B;
  --color-accent: #D8B36A;
  --color-accent-hover: #E8C77F;
  --color-success: #49C69A;
  --color-warning: #F0B85F;
  --color-danger: #F16B73;
  --color-info: #73A9F4;
}
```

---

# 4. Typography system

## 4.1 Font roles

- **Display/headlines:** Manrope, with system fallback.
- **Body/UI:** Inter, with system fallback.
- **Technical metadata:** Geist Mono.
- Self-host fonts after checking their current licence. Do not depend on a third-party font CDN for critical first paint.

## 4.2 Type scale

| Token | Desktop | Mobile | Weight | Usage |
|---|---:|---:|---:|---|
| Display | 56/62 | 38/44 | 650–750 | Hero title |
| H1 | 44/52 | 34/40 | 650–700 | Page title |
| H2 | 32/40 | 27/34 | 650 | Section title |
| H3 | 24/32 | 21/28 | 600 | Detail section |
| H4 | 20/28 | 18/26 | 600 | Card/dialog title |
| Body L | 18/28 | 17/26 | 400 | Synopsis/editorial |
| Body M | 16/24 | 15/23 | 400 | Main UI |
| Body S | 14/20 | 13/19 | 400–500 | Metadata |
| Caption | 12/16 | 12/16 | 500 | Labels/timestamps |
| Mono | 12/18 | 12/18 | 450 | IDs/technical labels |

Rules: sentence case; comfortable line-height; no thin text on dark backgrounds; synopsis width 55–80 characters; do not truncate important labels; test Bangla glyphs and mixed Bangla/Latin text.

---

# 5. Spacing, grid and geometry

## 5.1 Spacing tokens

`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px`.

Use 4 px as the base unit. Consistency matters more than mechanically applying one spacing value to every component.

## 5.2 Grid

| Viewport | Grid | Gutter | Side padding |
|---|---:|---:|---:|
| 360–639 | 4 columns | 12 px | 16–20 px |
| 640–767 | 6 columns | 16 px | 24 px |
| 768–1023 | 8 columns | 20 px | 28–32 px |
| 1024–1279 | 12 columns | 24 px | 32–40 px |
| 1280–1535 | 12 columns | 24 px | 48 px |
| 1536+ | 12 columns | 28 px | Auto center max 1440 px |

- Discovery container max: 1440 px.
- Detail content max: 1280 px.
- Long-form/editorial copy max: 760 px.
- Admin tables use the available width but preserve minimum readable column widths.

## 5.3 Aspect ratios

| Asset | Ratio | Rule |
|---|---:|---|
| Movie poster | 2:3 | `aspect-ratio: 2 / 3` |
| Wide backdrop | 16:9 | `aspect-ratio: 16 / 9` |
| Editorial banner | 21:9 | Use only with art direction/crop-safe content |
| Avatar | 1:1 | Circle or squircle |
| Trailer thumbnail | 16:9 | Never stretch a poster into this slot |
| Profile avatar | 1:1 | Consistent frame and fallback |

Always store multiple image renditions/crops or use a provider that supports safe transforms. Avoid one giant source image for every viewport.

## 5.4 Radius and elevation

- 4 px: micro labels.
- 8 px: input/button.
- 12 px: standard card.
- 16 px: large surface.
- 22 px: hero/media panel.
- 999 px: pill/chip.

Prefer subtle borders; use elevation only for dialogs, menus, toasts, and floating player controls. Avoid blur on every surface.

---

# 6. Motion system

| Token | Duration | Use |
|---|---:|---|
| Fast | 120 ms | Press/icon feedback |
| Standard | 180 ms | Card hover and menu |
| Enter | 240 ms | Dialog/drawer |
| Emphasis | 360 ms | Rare hero transition |

Use a calm ease-out curve. Respect `prefers-reduced-motion`. No sound autoplay. Hero video previews, if enabled, must be muted by default and user-controllable. Row carousels never auto-scroll. Motion must not delay Play or Resume.

---

# 7. Core component library

## 7.1 Component categories

**Foundation:** tokens, typography, grid, icon set, motion, focus ring.  
**Navigation:** desktop navbar, mobile bottom nav, breadcrumb, profile menu, search command.  
**Discovery:** movie poster card, featured hero, content row, collection tile, ranked card, filter chip, metadata pill.  
**Title:** movie detail header, synopsis block, cast/crew list, availability block, audio/subtitle list, related titles.  
**Playback:** player shell, play/pause, timeline, time display, quality menu, caption menu, audio menu, skip intro, next episode, error overlay, buffering indicator.  
**Account:** profile card, avatar picker, preferences, device sessions, watchlist row.  
**Admin:** sidebar, table, filter toolbar, upload dropzone, rights review panel, job state timeline, audit log, metric card.  
**Feedback:** skeleton, empty state, error state, toast, confirmation dialog, tooltip, progress bar.

## 7.2 Button variants

| Variant | Visual role | Example |
|---|---|---|
| Primary | Main action | Play / Resume |
| Secondary | Supporting action | Details / Trailer |
| Outline | Neutral action | Filter / Manage |
| Ghost | Low-emphasis action | More / Close |
| Destructive | Irreversible action | Delete / Revoke |

States: default, hover, focus-visible, pressed, disabled, loading. A loading button cannot submit twice. Icon-only buttons need accessible names and tooltips when context isn't obvious.

## 7.3 Movie Poster Card

**Anatomy:** art container, optional meaningful badge, hover/focus action layer, title, year and one verified metadata line.  
**Default ratio:** 2:3.  
**Behavior:** hover scale ≤1.035; slight elevation; no layout shift; actions available via keyboard and touch.  
**Mobile:** do not depend on hover; tap opens detail page, with a small explicit overflow action if necessary.  
**Data contract:** `id`, `title`, `year`, `poster`, `availability`, `displayBadges[]`, `href`. Never include a private media file link.

## 7.4 Content Row

- Title and optional description.
- Horizontal rail with scroll snap.
- Desktop previous/next buttons; mobile partial next-card peek.
- Keyboard and screen-reader support.
- No automatic movement.
- Hide arrows at boundaries.
- Lazy-load only near-visible poster assets.
- Support RTL direction.

## 7.5 Featured Hero

- Wide backdrop with responsive art variants.
- Gradient/scrim chosen per image, not assumed safe globally.
- Title, concise synopsis, verified metadata.
- Play/Resume as primary, Details as secondary.
- Optional trailer action only when a valid trailer asset exists.
- No audio autoplay; no full-screen forced video.

## 7.6 Search command

- Desktop: `Ctrl/Cmd + K` opens.
- Mobile: dedicated search route or full-height sheet.
- Debounce 180–250 ms; cancel stale requests.
- Search title, localized title, aliases, people, genres, and collections.
- Keyboard: Escape close, arrows navigate, Enter selects.
- Recent search is profile-scoped and user-clearable.
- Empty/error states preserve the query.

## 7.7 Player control primitives

- Center play/pause.
- Timeline with played, buffered, and live/current position visually distinct.
- Volume/mute.
- Captions/subtitle track picker.
- Audio-language picker.
- Quality selector with Auto default.
- Fullscreen/PiP if supported.
- Skip intro / recap / credits only when timestamps exist.
- Next episode only for series and with user setting.
- Error overlay with retry and support correlation ID.

---

# 8. Product information architecture

## 8.1 Main consumer navigation

```text
HOME
├── Featured
├── Continue Watching
├── Recommended
├── Recently Added
├── Curated Collections
└── Browse by Genre / Language / Country / Era

MOVIES
├── All Movies
├── Genres
├── Countries
├── Languages
├── Years
└── Collections

SEARCH
├── Suggestions
├── Titles
├── People
└── Collections

MY LIST
├── Saved
├── Watched
└── Continue Watching

PROFILE
├── Profiles
├── Preferences
├── Devices / Sessions
├── Privacy
└── Account Security
```

Add TV Shows/Series only if the product has episode/season data; do not show empty navigation categories.

## 8.2 Admin information architecture

```text
OVERVIEW
CATALOGUE
  ├── Titles
  ├── People
  ├── Collections
  └── Metadata Provenance
RIGHTS
  ├── Grants
  ├── Territories
  ├── Expiry Alerts
  ├── Approvals
  └── Takedowns
MEDIA
  ├── Uploads
  ├── Assets
  ├── Renditions
  ├── Captions / Audio
  └── Quality Control
PLAYBACK
  ├── Sessions
  ├── DRM Outcomes
  ├── QoE
  └── Provider Status
OPERATIONS
  ├── Jobs / Queues
  ├── Storage / Backups
  ├── Logs / Alerts
  └── Audit Trail
USERS
  ├── Accounts
  ├── Profiles
  ├── Reports
  └── Entitlements
SETTINGS
  ├── Providers
  ├── Roles / Permissions
  ├── Localization
  └── Feature Flags
```

---

# 9. Screen composition specs

## 9.1 Home desktop

```text
┌────────────────────────────────────────────────────────────────────┐
│ BRAND   Home   Movies   Collections              Search   Profile   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  FEATURED BACKDROP                                                 │
│  Title / concise synopsis                                          │
│  [ PLAY / RESUME ]  [ DETAILS ]                                    │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Continue Watching                                  View all  →     │
│ [Poster + progress] [Poster + progress] [Poster + progress]        │
│                                                                    │
│ Because you watched ...                            View all  →     │
│ [Poster] [Poster] [Poster] [Poster] [Poster]                       │
│                                                                    │
│ Curated collection                                                 │
│ [Editorial tile] [Editorial tile] [Editorial tile]                 │
│                                                                    │
│ Explore by genre / country / language                              │
└────────────────────────────────────────────────────────────────────┘
```

**Rules:** Keep hero copy short; avoid more than one large hero on screen; continue watching appears only when meaningful; no fake popularity; rows are data-driven and can be reordered per profile.

## 9.2 Movie detail desktop

```text
┌────────────────────────────────────────────────────────────────────┐
│ NAV                                                                │
├────────────────────────────────────────────────────────────────────┤
│ BACKDROP / GRADIENT                                                │
│ Poster  Title                                                      │
│         Year · Runtime · Genre · Country · Rating                  │
│         Synopsis                                                   │
│         [PLAY / RESUME] [TRAILER] [SAVE]                           │
├────────────────────────────────────────────────────────────────────┤
│ About / Cast & Crew / Audio & Subtitles                             │
│ [Person] [Person] [Person]                                         │
│                                                                    │
│ More like this                                                     │
└────────────────────────────────────────────────────────────────────┘
```

## 9.3 Watch page

```text
┌────────────────────────────────────────────────────────────────────┐
│ ← Back to title                                      Title / menu   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│                   16:9 SECURE PLAYER                               │
│                                                                    │
│              ▶ / buffer / captions / timeline                     │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│ Title · Episode (if relevant)                                      │
│ Short synopsis / next episode / audio & subtitle information       │
└────────────────────────────────────────────────────────────────────┘
```

The UI never displays a raw master file URL. This does not mean every manifest/segment request is invisible to browser developer tools; protected playback is enforced through server authorization, encrypted package delivery, and DRM where required.

## 9.4 Mobile home

- 56–64 px top header.
- Hero artwork compact enough to keep title and Play visible.
- Horizontal rows with 2.2–2.6 posters visible depending on viewport.
- Bottom navigation: Home, Search, My List, Profile.
- No nested hover action. Tap opens detail.

## 9.5 Admin content detail

- Header with title, state, public ID, and safe actions.
- Tab navigation: Metadata, Rights, Assets, Playback, Audit.
- Rights panel at top when publication is blocked or a grant is close to expiry.
- File status as a timeline, not a vague colored badge.
- Dangerous actions behind explicit confirmation and permission checks.

---

# 10. Player UX specification

## 10.1 Playback states

`idle → authorizing → preparing → buffering → playing ↔ paused → ended` with error, revoked, and unsupported branches.

The player must distinguish:

- Application is authorizing the viewer.
- Provider is preparing the playback session.
- Media is buffering.
- DRM/license is unavailable or denied.
- Network connection failed.
- Browser/device does not support the required DRM.
- Content is no longer available due to rights/session policy.

## 10.2 Control behavior

- Controls fade after inactivity only while playing; focus/keyboard interaction keeps controls visible.
- Space/K: Play/Pause where it does not conflict with text inputs.
- Left/Right: seek by a documented increment; Shift+Arrow can use a longer skip.
- Up/Down: volume where supported.
- M: mute; F: fullscreen; C: captions; Escape: exit fullscreen or close topmost layer.
- Do not hijack browser shortcuts or interfere with assistive technology.
- Seek timeline exposes current time, duration, and accessible slider value.
- Show time in `h:mm:ss` for long films and `m:ss` for short durations.
- If no 4K rendition exists, do not show 4K in the quality menu.

## 10.3 Subtitle and audio UX

- Default to profile preference when available; otherwise use browser/locale fallback and a clearly labeled default.
- Provide `Off` and language/track names.
- Label SDH/CC and audio description tracks accurately.
- Preserve subtitle position and style against bright/dark scenes.
- For Bangla, test glyph fallback, baseline, line height, punctuation, and multi-line placement.

## 10.4 Resume behavior

- Save progress periodically and on pause/seek/end.
- Resume only if the saved position is meaningful and the asset version is still compatible.
- Do not overwrite a later progress timestamp with an older concurrent-device event.
- Show a compact “Resume from 14:02” affordance where helpful.
- If the user finishes the film, clear Continue Watching or show it under watched history according to product rules.

---

# 11. Content imagery and artwork standards

- Use artwork only when display rights/metadata provider terms permit it.
- Store image provenance, source ID, license/terms reference, language, and crop metadata.
- Never hotlink arbitrary poster images from websites without permission.
- Generate responsive sizes: card thumbnail, detail poster, backdrop, hero crop, OG image where rights permit.
- Use AVIF/WebP with fallback according to browser support; preserve acceptable quality.
- Reserve aspect ratio to prevent layout shift.
- Use blur placeholder or neutral skeleton; avoid large blurry poster stretched to fill the screen.
- Hero crops should respect focal point metadata; allow manual focal point in admin.
- Alt text should describe informative artwork without duplicating the adjacent title. Decorative images use empty alt.

---

# 12. Accessibility acceptance checklist

- [ ] Keyboard-only navigation works from header through all rows and dialogs.
- [ ] Focus indicators are visible and not obscured by sticky nav or player controls.
- [ ] All card actions are available without hover.
- [ ] Every icon-only button has an accessible name.
- [ ] Normal text contrast is at least 4.5:1 where WCAG requires it.
- [ ] Large text contrast is at least 3:1 where WCAG requires it.
- [ ] Touch targets meet WCAG 2.2 minimum or use an allowed exception; primary controls are ideally 44–48 px.
- [ ] No information is conveyed by color alone.
- [ ] Dialogs trap/restore focus correctly.
- [ ] Carousels expose understandable semantics and keyboard navigation.
- [ ] Player can be operated without a mouse.
- [ ] Captions/subtitles are accessible and selectable.
- [ ] Audio description availability is represented.
- [ ] Reduced motion is honored.
- [ ] 200% zoom does not lose functionality.
- [ ] Bangla and long localized titles do not overflow or break layouts.
- [ ] RTL logical layout primitives are used where possible.

---

# 13. Figma file architecture

Create one Figma file with these pages:

1. `00 — Read Me`: product purpose, design principles, usage rules, tokens and changelog.
2. `01 — Foundations`: color variables, typography, grid, spacing, radius, elevation, motion, iconography.
3. `02 — Components`: buttons, inputs, cards, rows, chips, dialogs, menus, toasts, player controls, admin controls.
4. `03 — Patterns`: navigation, search, content rows, filter sheet, title details, playback shell, empty/error/loading states.
5. `04 — Consumer Screens`: Home, Browse, Search, Movie Detail, Watch, My List, Profile, Settings.
6. `05 — Admin Screens`: Overview, Catalogue, Rights, Upload/Processing, Asset Detail, Playback Monitor, Audit.
7. `06 — Responsive`: mobile/tablet/desktop screen comparisons and layout rules.
8. `07 — Prototypes`: critical user flows and player states.
9. `08 — Handoff`: redlines, interaction notes, content rules, accessibility annotations, and engineering tokens.

## 13.1 Figma variable collections

- `Color / Primitive`
- `Color / Semantic`
- `Type / Scale`
- `Space / Scale`
- `Radius / Scale`
- `Elevation / Scale`
- `Motion / Duration`
- `Layout / Breakpoint`

Build semantic variables referencing primitive values so a future light/admin theme can be added without replacing every component.

## 13.2 Component variants and naming

Use descriptive names such as:

- `Button / Primary / Default`
- `Button / Primary / Loading`
- `MovieCard / Poster / Default`
- `MovieCard / Poster / Hover`
- `MovieCard / Poster / Focus`
- `ContentRow / Standard`
- `Search / Command / Open`
- `Player / Controls / Visible`
- `Player / State / Buffering`
- `Player / State / DRM Error`
- `Availability / Stream Allowed`
- `Availability / Region Restricted`

Avoid arbitrary names like `Component 64` or `Frame 92` in handoff files.

---

# 14. Figma-ready design agent prompt

```text
Act as a principal product designer and design-systems lead for a premium movie
Discovery + authorized streaming platform.

Read the companion Master Blueprint and this complete Cinematic Graphite Design System.
Do not clone Netflix, Apple TV, MUBI, or any competitor's exact screens, identity, artwork,
copy, or visual assets. Use market patterns only as research input.

Create an original, premium, editorial-cinematic interface that prioritizes film artwork,
clear hierarchy, easy discovery, immediate playback, and trust. Use the provided semantic
color, typography, spacing, radius, motion, grid, and responsive tokens. Do not invent a
brand name or logo without approval; use a neutral wordmark placeholder until brand review.

Create Figma pages:
00 Read Me, 01 Foundations, 02 Components, 03 Patterns, 04 Consumer Screens,
05 Admin Screens, 06 Responsive, 07 Prototypes, 08 Handoff.

Design these complete screens:
- Home / Discover (new profile and returning profile)
- Browse / Catalogue with filters and sort
- Search command and full results
- Movie detail
- Secure watch page/player
- My List / Continue Watching
- Profile selector and profile settings
- Account security / devices
- Admin overview
- Catalogue editor
- Rights approval and expiry review
- Media upload / processing timeline
- Playback / DRM / QoE monitor
- Audit log

Include all states: default, hover, focus, pressed, selected, loading, empty, error,
disabled, expired, region restricted, processing, and permission denied. Hover must not be
required on touch devices. Ensure responsive frames at 360, 390, 430, 768, 1024, 1280,
1440, and 1920 px. Provide mobile, tablet, and desktop variants.

Player design must include playing, paused, buffering, authorizing, DRM/license error,
network error, captions menu, audio menu, quality menu, seek, resume, skip intro, and next
episode states. Do not imply that media endpoint URLs are invisible; visual design should
not expose original source paths, internal asset keys, or secrets.

Accessibility is a first-class requirement: WCAG 2.2 AA target, visible focus, contrast,
keyboard operation, readable targets, captions, audio description metadata, reduced motion,
200% zoom, and Bangla/mixed-language testing. Add annotations to explain interactions,
focus order, keyboard shortcuts, truncation, and responsive behavior.

Deliver:
1. Design rationale and competitor-pattern synthesis.
2. Complete token/variable system.
3. Components with variants and state matrix.
4. Responsive page designs and critical prototypes.
5. Accessibility annotations.
6. Handoff-ready layout and interaction specification.
7. Open questions and decisions requiring product-owner approval.

Avoid generic AI-generated visual tropes, gratuitous gradients, fake data, fake ratings,
excessive badges, over-rounded everything, and decorative controls with no behavior.
```

---

# 15. Engineering handoff requirements

For every design component, the design handoff must describe:

- Purpose and content/data requirements.
- Variants and state matrix.
- Responsive behavior and breakpoints.
- Keyboard/focus behavior.
- Screen-reader semantics.
- Motion/reduced-motion behavior.
- Loading, empty, error, and disabled states.
- Image aspect ratio, focal point, and crop behavior.
- API data required and fields that must never be exposed.
- Analytics event only where needed and privacy-reviewed.

A beautiful Figma mockup is not production-ready until every visible control has a real interaction contract and every dynamic label is backed by a real data source.

---

# 16. Design quality review rubric

Score each dimension 0–5. A launch candidate should average at least 4, with no critical category below 4.

| Dimension | Launch-quality signal |
|---|---|
| Distinct identity | Recognizable original art direction, not a Netflix recolor |
| Hierarchy | Artwork/title/Play action are clear on all screens |
| Discovery | Search, curation, filters, and personalization coexist |
| Information quality | Users can decide whether to watch without hunting for metadata |
| Player clarity | Controls and errors are understandable and accessible |
| Visual consistency | Tokens and component variants used across all surfaces |
| Responsive UX | No layout breaks from 360 px to 1920 px |
| Accessibility | Keyboard, focus, captions, contrast, reduced-motion, zoom validated |
| Performance | Image optimization, minimal layout shift, controlled client JS |
| Trust | Availability/quality/ratings only when verified; no fake buttons |

---

# 17. Reference links

- [Netflix — How recommendations work](https://help.netflix.com/en/node/100639/)
- [Apple — Human Interface Guidelines: Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video)
- [W3C — WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [Google — Widevine DRM overview](https://developers.google.com/widevine/drm/overview)
- [Mux — DRM guide](https://www.mux.com/docs/guides/protect-videos-with-drm)
- [Mux — Secure video playback](https://www.mux.com/docs/guides/secure-video-playback)
- [Shaka Player — DRM configuration](https://shaka-player-demo.appspot.com/docs/api/tutorial-drm-config.html)
- [Video.js — DRM media sources](https://videojs.org/docs/framework/html/guides/media-sources)
- [Cloudflare Stream — Secure your Stream](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/)
- [AWS MediaConvert — ABR output groups](https://docs.aws.amazon.com/mediaconvert/latest/ug/choosing-your-streaming-output-groups.html)

---

# Final design decision

The product should look and behave like a carefully art-directed cinema destination: premium dark graphite surfaces, warm restrained accent, confident typography, high-quality responsive artwork, deliberate editorial shelves, instant search, one clear Play/Resume action, and a player that is reliable and accessible. Its strongest point of differentiation should be the quality of discovery and playback—not the amount of decoration on the screen.
