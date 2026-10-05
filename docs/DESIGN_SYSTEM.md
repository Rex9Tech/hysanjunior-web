# Hysan Junior Design System

> **A cream-canvas, kid-friendly design system synced with Hysan Junior Mobile.**  
> Built with **Tailwind CSS v4** + **DaisyUI v5** on **React 19**.  
> Aesthetic Creed: Warm cream day gradient, HJ red & gold brand, deep wine night — high contrast without losing playfulness.

---

## 1. Architectural Overview & Philosophy

The design system enforces absolute centralization and zero redundancy. It solves theme management, typography scaling, and brand consistency at the root layer rather than distributing styling debt into hundreds of individual React components.

**Cross-platform sync (Web parent):** Web owns the token architecture and the **12–56** type scale. Mobile `HJ-*` typography names are display-role aliases only — they map onto web roles (`h1`, `body-m`, etc.), they are not a separate web API. Brand hex values, font families, and the day cream gradient stay aligned with `hysanjunior-mobile` `AppColors` / `AppFontFamilies`.

### Core Principles
1. **Single Point of Truth**: Every color, font, border radius, and glow effect originates strictly from `src/design/elements/`.
2. **Zero Hardcoded Colors**: No component or controller may contain hex codes (`#hex`), raw RGBA strings, or hardcoded utility colors (`text-white`, `text-black`, `bg-white`, `bg-black`).
3. **Flicker-Free Theme Toggling**: Themes (`day` and `night`) switch instantaneously via CSS variables bound to the root HTML attribute (`<html data-theme="...">`). Zero React component re-renders. Zero `dark:` prefix clutter.
4. **No Dumb / Redundant Code**: DaisyUI 5 natively produces semantic utility classes (`bg-base-100`, `text-base-content`, `bg-primary`, `text-primary-content`, `border-base-300`, `bg-secondary`, `bg-accent`, `bg-neutral`). We do not re-map or duplicate these inside `tailwind.config.js`.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React 19 + TypeScript | Component runtime & strict contract typing |
| **CSS Engine** | Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first styling with native CSS-variable discovery |
| **Token & Component Primitives** | DaisyUI v5 | Semantic color tokens, badges, buttons, modals, form controls |
| **State & Theme Management** | Jotai (`atoms.themeAtom`) + DOM hook | Root theme attribute binding (`document.documentElement.setAttribute('data-theme', theme)`) |
| **Class Merging** | `clsx` + `tailwind-merge` (`cn` helper) | Conflict-free className merging and conditional class composition |

---

## 3. Typography Engine

All typography tokens are centralized in [`src/design/elements/font.ts`](../src/design/elements/font.ts) and loaded in [`src/design/styles/fonts.css`](../src/design/styles/fonts.css).

```
src/design/elements/font.ts (Tokens)
       │
       ▼
tailwind.config.js (addBase :root injection)
       │
       ▼
src/design/styles/index.css (Applied globally to html, body)
```

### Font Families

| Token | Family Name | Fallbacks | Tailwind Utility | Primary Usage |
| :--- | :--- | :--- | :--- | :--- |
| `primary` | `"Fredoka"` | `sans-serif` | `font-primary`, default `sans` | General UI, body text, form fields, buttons, navigation |
| `display` | `"KGSecondChances"` | `cursive, sans-serif` | `font-display` | Headings, CTAs, hero titles (mobile display face) |
| `handwritten`| `"Fredoka"` | `sans-serif` | `font-handwritten` | Alias of primary (mobile has no separate handwritten face) |
| `mono` | *System Monospace* | `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace` | `font-mono` | IDs, UUIDs, coupon codes, hashes, tokens, timestamps, JSON telemetry, data tables |

### Type Scale (Web Parent — 12–56)

| Token | Size / Line | Weight |
| :--- | :--- | :--- |
| `displayXL` | 56 / 64 | 700 |
| `displayL` | 48 / 56 | 700 |
| `displayM` | 36 / 44 | 600 |
| `h1` | 32 / 40 | 600 |
| `h2` | 28 / 36 | 600 |
| `h3` | 24 / 32 | 600 |
| `h4` | 20 / 28 | 500 |
| `bodyL` | 18 / 28 | 400 |
| `bodyM` | 16 / 24 | 400 |
| `bodyS` | 14 / 20 | 400 |
| `caption` | 12 / 16 | 400 |

### Global Typography Inheritance
- `html` and `body` automatically inherit `var(--font-primary)`.
- Default Tailwind `font-sans` is mapped to `[font.fontFamily.primary]`.
- Default Tailwind `font-mono` is mapped to `[font.fontFamily.mono]`.
- **To swap fonts globally**: Update [`src/design/styles/fonts.css`](../src/design/styles/fonts.css) and [`src/design/elements/font.ts`](../src/design/elements/font.ts). The entire application updates automatically without touching any UI components.

---

## 4. Color & Theme Architecture

All colors are centralized in [`src/design/elements/colors.ts`](../src/design/elements/colors.ts).

### Brand & Accent Colors (synced with mobile)
- **HJ Primary Red**: `#ea2a33` (RGB: `234, 42, 51`)
- **Primary Light**: `#FF5263`
- **Primary Dark**: `#CC1125`
- **HJ Secondary Gold**: `#ffce30`
- **Accent Laser Red**: `#FF0D2D`
- **Glow Outer Core**: `#5C0916` (RGB: `92, 9, 22`)
- **Glow White Core**: `#FFF2F4`

### Day Cream Gradient
- Solid fallback / `base-100`: `#FAFAF8`
- Gradient: `linear-gradient(to bottom right, #FFF6D2, #FFF4CF)` via `--color-background-gradient`
- Surfaces / cards: `#FFFDF8`
- Applied on `html` + `body` in day theme; night clears the gradient (`none`)

### Theme Contrast Matrix

| Semantic Token | Day Mode (`day`) | Night Mode (`night`) | Description |
| :--- | :--- | :--- | :--- |
| `primary` | `#ea2a33` | `#ea2a33` | Hysan Junior brand red |
| `primary-content` | `#FFFFFF` | `#FFFFFF` | High-contrast white text on red buttons |
| `base-100` | `#FAFAF8` (+ cream gradient) | `#160B11` | Main page background |
| `base-200` | `#FFFDF8` | `#1F1018` | Surface containers |
| `base-300` | `#FFFDF8` | `#26131E` | Cards / panels |
| `base-content` | `#000000` | `#FFFFFF` | Main body text |
| `secondary` | `#ffce30` | `#ffce30` | HJ gold |
| `accent` | `#FF0D2D` | `#FF0D2D` | Tertiary accent |
| `neutral` | `#FFFDF8` | `#26131E` | Neutral surfaces |
| `neutral-content` | `#000000` | `#FFFFFF` | Text on neutral surfaces |

### Semantic Status Indicators
All semantic indicators enforce `#FFFFFF` foreground text (`*-content`) for AAA contrast:
- **Info**: `#38BDF8` (`text-info`, `bg-info/10`, `border-info/30`)
- **Success**: `#10B981` (`text-success`, `bg-success/10`, `border-success/30`)
- **Warning**: `#F59E0B` (`text-warning`, `bg-warning/10`, `border-warning/30`)
- **Error**: `#EF4444` (`text-error`, `bg-error/10`, `border-error/30`)

### Glassmorphism & Neon Effects
Centralized in `colors.glass` and `colors.effects`:
- **Glass Nav**: `rgba(22, 7, 13, 0.75)`
- **Glass Card**: `rgba(35, 12, 20, 0.38)` with `border: rgba(234, 42, 51, 0.22)`
- **Glass Card Hover**: `rgba(50, 16, 28, 0.55)` with `border: rgba(234, 42, 51, 0.55)`
- **Neon Sign**: Multi-layer box/text shadows radiating from `var(--color-glow-white)` through `var(--color-primary)` to `var(--color-glow-outer)`.

---

## 5. Clean Tailwind Configuration (`tailwind.config.js`)

Theme CSS variables (including `--color-background-gradient`) are injected via `addBase` from `src/design/elements/colors.ts` and `font.ts`. `theme.extend.colors` only declares custom extensions that DaisyUI does not natively supply (`primary` variants, `glow`, `glass`).

---

## 6. How Theme Switching Works

The theme system operates with zero latency and zero React re-render cascades:

```
[User clicks ThemeToggle.tsx]
           │
           ▼
atoms.themeAtom updated in Jotai
           │
           ▼
useTheme() hook executes:
document.documentElement.setAttribute('data-theme', theme)
           │
           ▼
Browser activates matching CSS variables on :root:
--color-base-100, --color-base-content, --color-primary,
--color-background-gradient, etc.
           │
           ▼
Entire DOM updates styles natively in CSS in < 1ms
```

---

## 7. Component Library Catalog (`src/design/components/`)

### Action Controls
- **`Button`**: Primary (HJ red), Secondary, Tertiary, Neon/Glass. Natively applies `text-primary-content` on solid red buttons.
- **`AdminTableActions`**: Compact square icon buttons for high-density administrative tables.

### Form Inputs
- **`TextInput`**: Underline-glass or boxed-bordered variant with theme-adaptive label and error states.
- **`TextArea`**: Auto-resizing or fixed multi-line input with interactive `hover:border-primary`.
- **`PasswordInput`**: High-security 6-digit segmented passcode control with auto-advance, backspace handling, paste distribution, masked characters, and `font-mono`/`font-primary`.
- **`SearchInput`**: Debounced search field with search-by metadata tooltips and clear button.
- **`Dropdown`**: Single and multi-select select input with optgroup support.
- **`Checkbox` & `Radio`**: High-contrast styled checkboxes and radios with `checked:bg-primary` and `hover:border-primary`.
- **`Toggle`**: Accessible toggle switch with smooth slide animation.
- **`FileInput`**: Stylized file upload with file type constraints and trigger buttons.
- **`DateTimePicker`**: DaisyUI-styled date and time picker supporting `datetime-local`, `date`, and `time` modes, clear action, min/max range constraints, and field-level error messages.
- **`NumberInput`**: DaisyUI-styled numeric input with automatic sanitization stripping invalid leading zeroes (e.g. `05` → `5`, `00` → `0`, while preserving decimals like `0.5`), min/max bounds clamping, stepper controls, and prefix/suffix adornments.

### Overlays & Dialogs
- **`Dialog`**: Accessible modal with focus containment, ESC key dismissal, click-outside backdrop (`.modal-backdrop`), and smooth transitions.
- **`ConfirmDialog`**: Standalone destructive / confirmation action prompt.
- **`LoadingOverlay`**: Non-blocking global spinner with subtle dimming scrim (`bg-black/20`).

### Detail & Presentation Primitives
- **`DetailHeader`**: Resource detail view header with title, back navigation, status badge, and action slots.
- **`DetailSection`**: Grouped card section with optional accent line and `hover:border-primary`.
- **`DetailGrid`**: Responsive 1-to-4 column grid layout for key-value resource attributes.
- **`DetailField`**: Individual label/value pair supporting text, badges, code (`font-mono`), copy buttons, and links.
- **`CopyButton`**: Clipboard copy button with tactile visual feedback.

---

## 8. Constitutional Rules for Developers

When contributing code to this web client, adhere strictly to these rules:

1. **NO Hardcoded Hex Codes**:
   - ❌ `<div style={{ color: "#ea2a33" }}>`
   - ✅ `<div className="text-primary">` or `<div style={{ color: "var(--color-primary)" }}>`

2. **NO Hardcoded `text-white` or `text-black`**:
   - ❌ `<span className="text-black dark:text-white">`
   - ❌ `<span className="text-white">` (on default background)
   - ✅ `<span className="text-base-content">`
   - ✅ `<span className="text-primary-content">` (on `bg-primary` buttons/badges)

3. **NO Redundant Tailwind Color Definitions**:
   - Do not add `base`, `neutral`, `secondary`, or `accent` to `theme.extend.colors`. DaisyUI provides them natively.

4. **Monospace for Code, Tokens & Telemetry**:
   - Any UUID, hash, coupon code, date/time timestamp, or technical token MUST use `font-mono`.

5. **Interactive Borders Must Use `hover:border-primary`**:
   - All interactive cards, tiles, and form inputs must use `hover:border-primary` for the brand red interaction cue.
