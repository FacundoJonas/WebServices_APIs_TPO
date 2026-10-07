---
name: DeliveryGo Web Portal
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daea'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eefe'
  surface-container-high: '#e2e8f8'
  surface-container-highest: '#dce2f3'
  on-surface: '#151c27'
  on-surface-variant: '#3d4a44'
  inverse-surface: '#2a313d'
  inverse-on-surface: '#ebf1ff'
  outline: '#6c7a74'
  outline-variant: '#bccac2'
  surface-tint: '#006b53'
  primary: '#006b53'
  on-primary: '#ffffff'
  primary-container: '#00a884'
  on-primary-container: '#003427'
  inverse-primary: '#59dcb5'
  secondary: '#5c5f61'
  on-secondary: '#ffffff'
  secondary-container: '#dee0e2'
  on-secondary-container: '#606365'
  tertiary: '#0053db'
  on-tertiary: '#ffffff'
  tertiary-container: '#678fff'
  on-tertiary-container: '#002771'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#79f9d0'
  primary-fixed-dim: '#59dcb5'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#00513e'
  secondary-fixed: '#e1e2e5'
  secondary-fixed-dim: '#c5c7c9'
  on-secondary-fixed: '#191c1e'
  on-secondary-fixed-variant: '#444749'
  tertiary-fixed: '#dbe1ff'
  tertiary-fixed-dim: '#b4c5ff'
  on-tertiary-fixed: '#00174b'
  on-tertiary-fixed-variant: '#003ea8'
  background: '#f9f9ff'
  on-background: '#151c27'
  surface-variant: '#dce2f3'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.005em
  title-md:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-lg-medium:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0em
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0em
  body-md-medium:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0em
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.01em
  caption-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.01em
  caption-bold:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  space-2xs: 0.25rem
  space-xs: 0.5rem
  space-sm: 0.75rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
  space-2xl: 3rem
  space-3xl: 4rem
  container-max: 1280px
  gutter-mobile: 1rem
  gutter-desktop: 1.5rem
---

## Brand & Style

This design system drives a high-velocity, multi-vertical commerce ecosystem tailored specifically to the Argentine market (food, grocery, courier, and specialty stores). The emotional signature blends everyday reliability with urban vitality: effortless, warm, prompt, and scrupulously transparent. 

The aesthetic style is **Modern Utilitarian with Tactile Softness**. It strips away visual clutter in favor of scannable product feeds, legible pricing hierarchies (ARS currency clarity), and instantaneous cart feedback. It balances crisp operational precision (order dispatch, real-time live map tracking, store status indicators) with an approachable, appetizing atmosphere. Interfaces prioritize frictionless tap targets, intuitive localized copy (voseo standard: *“Pedí ahora”*, *“Seguí tu pedido”*), and responsive web performance across high-end desktop browsers and entry-level mobile web devices.

## Colors

The palette centers on an energetic, organic green-teal that conveys fresh ingredients, rapid logistics, and affirmative interaction states, balanced by deliberate architectural neutrals.

### Palette Architecture
- **Brand Primary (`#00A884`):** Main interactive driver used for prime CTAs, active toggles, cart indicators, order progress highlights, and selection boundaries.
- **Brand Primary Hover / Dark (`#008F6F`):** Pressed and hover state for primary interactive elements.
- **Brand Primary Soft (`#E6F6F3`):** Tinted substrate for active pills, delivery fee badges, and selected item backgrounds.
- **Secondary / High-Contrast Dark (`#1A1D1F`):** Anchors page titles, critical pricing figures, store names, and dark-mode persistent bottom bars.
- **Neutral Secondary Text (`#6B7280`):** Used for metadata, preparation time estimates, address secondary lines, and placeholder text.
- **Neutral Subtle Border (`#E5E7EB`):** Demarcates product tiles, dividers, input perimeters, and modular card structures.
- **Neutral Surface / Canvas (`#F7F8FA`):** Low-strain background color providing distinct separation from elevated white cards.
- **Pure White Surface (`#FFFFFF`):** High-clarity foreground for interactive modules, product cards, popovers, and sticky headers.

### Semantic Intent
- **Success (`#16A34A` / BG `#ECFDF5`):** Payment approvals, active store openings, delivered order states.
- **Warning (`#F59E0B` / BG `#FFFBEB`):** High demand delay alerts, limited stock warnings, store closing soon.
- **Error (`#DC2626` / BG `#FEF2F2`):** Rejected cards, out-of-stock items, delivery address out-of-zone.
- **Info (`#2563EB` / BG `#EFF6FF`):** Promotions, cross-vertical grocery notices, tipping info.

## Typography

The type system relies completely on **Inter** to ensure maximum computational legibility across differing pixel densities, multi-column listing grids, and numerical layouts. 

### Typographic Hierarchy & Character
- **Numbers and Currency:** Prices must always render using tabular figures (`font-variant-numeric: tabular-nums`) with medium or bold weights (`$ 4.250`) to avoid layout twitching during subtotal calculations.
- **Headings:** Range between 24px and 32px with tight tracking (`-0.015em`) to preserve structural gravity on desktop while cleanly wrapping on mobile viewport widths.
- **Body & Secondary Copy:** Restricted to 14px and 16px with balanced leading (`1.42` to `1.5`) to maximize scannability inside compact dish descriptions and dietary tags.
- **Tone & Copywriting:** Native Argentine Spanish (Rioplatense dialect with natural voseo) for instructional and action copy (e.g., *“Elegí tus ingredientes”*, *“Ingresá tu dirección de entrega”*, *“Confirmar pedido”*).

## Layout & Spacing

The layout model utilizes an adaptive 12-column responsive fluid grid built on an 8px spatial frequency (with a 4px half-step for micro-alignment within badges and input paddings).

### Responsive Breakpoints
- **Mobile (0 – 639px):** 4 columns. Gutter: 16px (`1rem`). Outer margin: 16px (`1rem`). Single-column store feeds and dish listings. Persistent bottom checkout bar.
- **Tablet (640px – 1023px):** 8 columns. Gutter: 20px. Outer margin: 24px. 2-column dish grids; sticky top categories filter bar.
- **Desktop (1024px – 1280px+):** 12 columns. Gutter: 24px (`1.5rem`). Outer margin: auto with `max-width: 1280px`. Left-side filters (3 cols), center feed (6 cols), and persistent sticky right-rail cart drawer (3 cols).

### Architectural Rules
- Density is optimized for shopping speed: category horizontal scrolls retain a peek affordance (`padding-right: 2rem`) on mobile.
- Card padding remains compact: 12px for items with inline thumbnail imagery; 16px for full store headers and order receipts.

## Elevation & Depth

Visual hierarchy uses a calm combination of crisp surface outlines and ambient diffusion shadows to retain interface lightness against the `#F7F8FA` background.

### Elevation Levels
- **Level 0 (Flat Ground):** Background canvas (`#F7F8FA`) with no shadows.
- **Level 1 (Card & Product Tiles):** Standard interactive surfaces (`#FFFFFF`). Border: `1px solid #E5E7EB`. Shadow: `0 2px 8px rgba(0, 0, 0, 0.06)`. Hover state raises subtly to `0 4px 14px rgba(0, 0, 0, 0.08)` accompanied by `#D1D5DB` border transition.
- **Level 2 (Sticky Headers, Floating Categories & Popovers):** Shadow: `0 4px 16px rgba(0, 0, 0, 0.08)`. Border: `1px solid #E5E7EB`. Backdrop-filter: `blur(8px)` with `rgba(255, 255, 255, 0.92)` opacity on scroll over feeds.
- **Level 3 (Modals, Customization Sheets & Active Drawer):** Shadow: `0 12px 32px rgba(26, 29, 31, 0.16)`. Dark scrim overlay using `rgba(26, 29, 31, 0.48)`.

## Shapes

The portal adopts an approachable **Rounded** architecture that balances geometric rigor with friendly consumer touchpoints.

### Radius Assignments
- **Core Cards & Modules (`12px` / `0.75rem`):** All vendor listings, food items, summary order boxes, and container sheets utilize `12px` radii to create clear separation.
- **Form Controls & Buttons (`8px` to `10px`):** Text inputs, search fields, counter buttons, and standard action buttons use an aligned medium curve for tactile stability.
- **Category Chips, Status Badges & Pills (`9999px`):** Filter tags (e.g., *“Empanadas”*, *“Hamburguesas”*, *“Supermercado”*), ETA badges, and counter pills remain fully circular for clear affordance differentiation against content cards.

## Components

### Buttons
- **Primary:** Solid `#00A884`, text `#FFFFFF`, radius `10px`, height `48px` (mobile touch) or `44px` (desktop). Hover: `#008F6F`. Focus: `box-shadow: 0 0 0 3px rgba(0, 168, 132, 0.3)`.
- **Secondary / Outline:** Background `#FFFFFF`, border `1.5px solid #E5E7EB`, text `#1A1D1F`. Hover: Background `#F7F8FA`, border `#D1D5DB`.
- **Quantity Selector:** Compact 3-part pill: `[-] [count] [+]` with subtle border, `#1A1D1F` text, and `#00A884` active buttons.

### Form Inputs & Search
- **Text Inputs:** White fill, `1px solid #E5E7EB`, label visible at all times above the field (`font-size: 13px`, medium, `#1A1D1F`). Height `44px`. Placeholder `#6B7280`. Focus: `#00A884` border and `0 0 0 3px rgba(0, 168, 132, 0.2)` ring. Error: `#DC2626` border and ring.
- **Address Bar:** Prominent search bar with leading pin icon, auto-complete dropdown, clear affordance, and immediate location switcher (*“Entregar en: Palermo, CABA”*).

### Chips & Filters
- **Filter Pills:** Height `36px`, rounded `9999px`. Unselected: `#FFFFFF` fill, `#E5E7EB` outline, `#1A1D1F` text. Selected: `#00A884` fill, `#FFFFFF` text, shadow `0 2px 6px rgba(0, 168, 132, 0.25)`.

### Cards
- **Store Card:** Full-width image header with aspect ratio 16:9, rounded `12px`, soft shadow `0 2px 8px rgba(0,0,0,0.06)`. Contains delivery time badge (`20-30 min`), delivery fee (`$ 499`), and aggregate rating (`★ 4.8`).
- **Product / Dish Card:** Horizontal layout with `80x80px` or `96x96px` image preview on right, title, short description truncated to 2 lines, price in bold ARS, and an add button (`+`) pinned bottom right.

### Checkboxes & Radios
- Size `20x20px`. Unchecked: `1.5px solid #D1D5DB`, background `#FFFFFF`. Checked: Solid `#00A884` with white checkmark/dot indicator. Applied explicitly to modifier sheets (e.g., choice of sauce, beverage sizing, extra toppings).

### Live Order Status Tracker
- Stepped segmented progress bar colored with `#00A884`. States: *“Confirmado”*, *“En preparación”*, *“En camino”*, *“Entregado”*. Live delivery icon pulses subtly with green-teal glow.