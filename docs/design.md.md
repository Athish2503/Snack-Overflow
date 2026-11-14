# Snack Overflow: Design System and UI/UX Spec

Companion to the Snack Overflow PRD (Bipolar Factory, Full Stack Intern Round 2). Version 1.0.

## 1. Design concept

**"Sticker-shop pantry."** The look is playful (chunky borders, hard offset shadows, emoji, bouncy micro-interactions) but built on a strict token system, so it stays consistent and production-ready. The name nods to Stack Overflow, so the tangerine primary and monospace numbers are deliberate in-jokes for a dev-heavy office.

The rule that keeps it professional: **fun lives in surfaces and motion, never in the information.** Stock status, errors and forms stay clear and predictable.

## 2. Color palette

### Core (light mode)

| Token | Hex | Use |
| --- | --- | --- |
| --bg | #FFF8EC | App background (warm cream) |
| --surface | #FFFFFF | Cards, dialogs |
| --surface-2 | #FFF1D6 | Hover rows, table headers, input fill |
| --ink | #1B1B2F | Text, borders, hard shadows |
| --ink-muted | #5B5B72 | Secondary text |
| --primary | #FF7A1A | Primary buttons, active nav, accents |
| --primary-soft | #FFE3CC | Selected states, highlights |
| --accent | #7C5CFF | Votes, Snack of the Week, admin badge |
| --accent-soft | #E9E3FF | Vote chip background |

### Stock status (semantic, never reused for anything else)

| Status | Solid | Soft bg | Text on soft | Icon |
| --- | --- | --- | --- | --- |
| Stocked | #22B07D | #D6F5E8 | #0B5A3F | ✓ |
| Running Low | #F5B700 | #FFF0B8 | #6B4E00 | ⚠ |
| Gone | #EF4B4B | #FFDADA | #8A1C1C | ✕ |

### Category tints (small dots and emoji backgrounds only)

| Category | Tint | Emoji |
| --- | --- | --- |
| Sweet | #FF8FB8 | 🍬 |
| Savoury | #C98B5A | 🥨 |
| Drink | #4DB8FF | 🥤 |
| Healthy-ish | #8BD450 | 🥕 |

### Dark mode

bg #14121F, surface #1F1C2E, surface-2 #2A2640, ink #FFF8EC, ink-muted #B6B2CC. Borders become rgba(255,248,236,.28). Hard shadows switch to black at 60% opacity. Status colors stay the same, with text-on-soft swapped to the solid color.

### Accessibility rules

- Use **ink text on tangerine buttons, not white**. White on #FF7A1A is about 2.6:1 and fails; ink passes comfortably.
- Status is always color + icon + label, never color alone.
- Focus ring: 3px accent with 2px offset on every interactive element.

### Tokens (globals.css)

```css
:root {
  --bg:#FFF8EC; --surface:#fff; --surface-2:#FFF1D6;
  --ink:#1B1B2F; --ink-muted:#5B5B72;
  --primary:#FF7A1A; --primary-soft:#FFE3CC;
  --accent:#7C5CFF; --accent-soft:#E9E3FF;
  --ok:#22B07D; --warn:#F5B700; --bad:#EF4B4B;
  --radius-sm:10px; --radius-md:16px; --radius-lg:24px;
  --border:2px solid var(--ink);
  --shadow-sticker:4px 4px 0 var(--ink);
  --shadow-sticker-hover:6px 6px 0 var(--ink);
  --shadow-sticker-press:1px 1px 0 var(--ink);
  --ease-out:cubic-bezier(.22,1,.36,1);
  --ease-bounce:cubic-bezier(.34,1.56,.64,1);
  --dur-fast:120ms; --dur-base:220ms; --dur-slow:420ms;
}
```

### Typography

- **Headings and card numbers:** Bricolage Grotesque.
- **Body and forms:** Inter or DM Sans.
- **Quantities, counts, timestamps:** JetBrains Mono with tabular-nums so digits don't jitter while animating.
- **Scale:** 12 / 14 / 16 / 20 / 24 / 32 / 44, fluid headings via clamp(1.75rem, 4vw, 2.75rem).
- Load through next/font with display: swap.

## 3. Layout and component placement

### Breakpoints

| Name | Width | Layout |
| --- | --- | --- |
| base | under 640 | Single column, bottom tab bar |
| sm | 640 | 2-column snack grid |
| md | 768 | Icon-rail sidebar (72px), 3-column grid |
| lg | 1024 | Full sidebar (240px), 3-column grid, detail side panel |
| xl | 1280 | 4-column grid |
| 2xl | 1536 | Content capped at 1440px, centered |

### App shell

- **Desktop (lg+):** sticky 240px sidebar (logo, Home, Snacks, Activity for admins, theme toggle) plus a top bar with page title, search and the user menu. Content max-width 1440px, px-8.
- **Tablet (md):** sidebar collapses to a 72px icon rail with tooltips.
- **Mobile:** sticky 56px top bar, content with px-4 and pb-24, and a 64px bottom tab bar (Home, Snacks, Activity for admins) with env(safe-area-inset-bottom) padding. Use 100dvh, not 100vh.

### Login page

- **Desktop:** split screen. Left half is a tangerine panel with floating snack emojis and the tagline "Never fight over the last packet again." Right half is the form card.
- **Mobile:** the panel collapses into a short header strip above the form.
- **Form card:** logo, email, password with show/hide toggle, full-width primary button, inline error area with role="alert".
- **Demo helper:** chips "Use Admin demo" and "Use Member demo" that autofill credentials. Useful for reviewers.

### Dashboard (/)

1. **Greeting row:** "Good afternoon, Priya 👋" plus a role badge (Admin violet, Member neutral).
2. **Summary cards:** Total (neutral), Stocked (green), Running Low (amber), Gone (red). 2×2 grid on mobile, 1×4 row from md. Each card links to /snacks?status=...
3. **Snack of the Week hero:** full-width violet sticker card. At lg the emoji sits left (about 30%) and name, votes, View snack button and 👑 badge sit right. Below lg it stacks.
4. **Two-column section** (stacks on mobile): "Running low" compact list with mini stock meter and quick Consume, and "Recently updated" with relative timestamps.
5. **CTA row:** Browse all snacks.

### Snack inventory (/snacks)

- **Filter bar:** one row on md+ (search, Category, Status, Sort). On mobile, search is full width and filters collapse into a "Filters (2)" button opening a bottom sheet with Apply and Reset.
- **Active chips** under the bar, with "Clear all".
- **Search:** debounced 300ms and synced to the URL query string so filters survive refresh and sharing.
- **Admin only:** "+ Add snack" top-right on desktop, floating action button above the tab bar on mobile.
- **Pagination:** numbered pager on md+; Prev / "Page 2 of 8" / Next on mobile.

### Snack detail

- **Desktop (lg+):** 480px right slide-over so grid context is kept.
- **Mobile:** bottom sheet at about 85dvh with drag handle (vaul).
- **Also** a full route /snacks/:id for deep links.
- **Contents:** emoji header, name, category chip, status badge, large stock meter with quantity, consume stepper, vote button, and (admin only) Restock, Edit and Archive.

## 4. Component designs

### Base sticker style

All cards, buttons, inputs and chips: 2px ink border, 16px radius, 4px 4px 0 ink shadow. **Hover** (only inside @media (hover:hover)): translate(-2px,-2px) and shadow grows to 6px. **Press:** translate(3px,3px) and shadow shrinks to 1px.

### Summary card

Icon tile (40px, status soft background) top-left, big number in Bricolage 44px with count-up on first load, muted 14px label, a decorative SVG corner shape with pointer-events none. Entire card is a link.

### Snack card

Top row: emoji tile, category chip, vote toggle with count. Then the name (2-line clamp), the stock meter with mono quantity, the status badge, and the action row with the consume stepper.

- **Stock meter:** 10px pill. Fill ratio = quantity / max(threshold × 3, quantity), capped at 100%, colored by status, with a faint tick at the threshold. Animate with transform: scaleX, not width.
- **Gone:** desaturated emoji, striped background, rotated "GONE" stamp, disabled button reading "Out of stock".
- **Running Low:** small amber dot pulsing with opacity only.
- **Vote toggle:** heart in accent color, outline when not voted, filled when voted.

### Stock status badge

Pill with icon, label and soft background: ✓ Stocked, ⚠ Running low, ✕ Gone.

### Consume stepper

&#91; − \] 3 \[ + \] \[ Consume \]. Mono number, 44×44 buttons. Min 1, max current quantity (+ disables at the cap). Direct typing allowed, validated as integer, inline error ("Only 7 left"). Button shows a spinner and is disabled while pending.

### Vote button

Chip with heart and count. On click the heart scales 1 → 1.35 → 1 with bounce easing and the count rolls. Optimistic update with rollback on failure.

### Admin forms

- **Add / Edit:** dialog on desktop, full-height sheet on mobile. Fields: Name, Category (segmented control with emojis), Initial quantity (create only), Low-stock threshold. Inline validation on blur.
- **Restock:** small popover with stepper and quick-add chips (+5, +10, +25).
- **Archive:** confirm dialog stating the consequence ("Hidden from the pantry. History is kept.") with a red-outlined confirm button.

### Activity log (admin)

- **Desktop:** table with Avatar + User, Snack, Action badge (violet Consumed, green Restocked), Qty (mono, signed −2 / +10), Time (relative, absolute on hover).
- **Mobile:** each row becomes a compact card, since tables don't survive 375px.
- Server-side pagination below.

### Toasts

Use sonner. Bottom-center on mobile (above the tab bar), bottom-right on desktop. Variants: success, error, and a **conflict toast** with the copy "Someone beat you to the last packet! Refresh the inventory and try again." and a Refresh action.

## 5. State design

| State | Treatment |
| --- | --- |
| Loading | Skeleton cards matching real card dimensions (no layout shift) with soft shimmer. Buttons show inline spinner. |
| Empty (no snacks) | 🫙 illustration, "The pantry's empty. Suspicious." Admin sees "Add the first snack". |
| Empty (no matches) | 🔍 "No snacks match those filters" with Clear filters. |
| Error (fetch failed) | Inline card with 🫠, short message, Retry. Never a blank screen. |
| 409 conflict | Toast, card quantity refreshes in place, short shake. |
| 401 / 403 | 401 redirects to login with "Session expired". 403 shows a friendly "Admins only" page. |
| Success | Toast plus a local micro-animation. |

## 6. Animation system

### Principles

1. Animate only **transform and opacity** (GPU-composited). Never width, height, top or left.
2. One motion language: three durations, two easings from the tokens.
3. Respect prefers-reduced-motion: replace movement with fades, disable loops.
4. Motion confirms an action; it never blocks one.

### Specific animations

| Interaction | Animation | Timing |
| --- | --- | --- |
| Route change | Fade + 8px rise | 220ms ease-out |
| Grid on load | Stagger fade-up, first 12 items only | 40ms stagger |
| Card hover | Lift and shadow grow | 120ms |
| Button press | Shift into shadow | 80ms |
| Consume success | Digit rolls down, meter shrinks, one green outline flash | 420ms |
| Reaching Running low | Badge cross-fades to amber with one small bounce | 320ms |
| Reaching Gone | Card desaturates, GONE stamp slams in (scale 1.6 → 1, rotate −8°) | 360ms bounce |
| Vote | Heart pop plus count roll | 280ms |
| Restock success | 5–8 emoji particles burst from the quantity, one-shot | 700ms |
| 409 conflict | Horizontal shake (±6px, 3 cycles) | 360ms |
| Summary numbers | Count-up on first mount only | 600ms |
| Sheet / dialog | Slide-up (mobile) or scale-fade (desktop) | 220ms |
| Snack of the Week | 👑 idle wiggle every 6s, paused off-screen | n/a |

### Keeping animations intact across screen sizes

- **No hardcoded pixel travel.** Use rem or % so nothing overshoots on small screens.
- **CSS solves layout, JS animates.** Grids use repeat(auto-fill, minmax(260px, 1fr)); animations apply to cards, not the grid.
- **Framer Motion layout prop selectively:** for filtering and reordering (AnimatePresence + stable key=snack.id), never on elements that also resize at breakpoints.
- **Sidebar full → rail → tab bar is a CSS swap with no transition.** Only the mobile drawer animates, via transform: translateX.
- **Breakpoint-aware variants:** a useMediaQuery('(min-width:1024px)') hook picks x-slide on desktop and y-slide on mobile for the detail view.
- **Isolate stacking and clipping:** hover cards use isolation: isolate, and the grid has pb-2 pr-2 so the 6px shadow isn't clipped by overflow:hidden parents.
- **Wrap hover effects in @media (hover:hover)** so touch devices don't stick in hover.
- **Reserve space for everything that animates in:** skeletons match final dimensions, tiles have fixed aspect ratios.
- **will-change: transform sparingly,** only mid-animation, and remove it afterward.
- **Test on real devices:** throttled mid-range Android in Chrome DevTools, plus iOS Safari for position:fixed and dynamic toolbar quirks.

### Optimistic UI

For consume and vote: update instantly, send with an Idempotency-Key, and on 409 or error roll back with the shake and the conflict toast. Always reconcile with the server's returned quantity, not the local guess.

## 7. Production-readiness checklist

- Touch targets at least 44×44px.
- Everything keyboard reachable with visible focus.
- Dialogs trap focus and close on Esc (shadcn/Radix defaults).
- Real labels, aria-invalid and aria-describedby on forms.
- aria-live="polite" for toasts and stock-change announcements.
- Status never by color alone.
- Fixed aspect ratios for images and emoji tiles.
- URL-synced filters and pagination (shareable, back-button safe).
- Light and dark theme through CSS variables with next-themes.
- Document component states: default, hover, focus, active, disabled, loading, error.

## 8. Suggested tooling

Tailwind (tokens mapped in tailwind.config), shadcn/ui restyled with sticker tokens, framer-motion, vaul for bottom sheets, sonner for toasts, lucide-react for icons, next-themes for dark mode.
