# Organic Store Design Notes

## Design Direction

The interface now uses a safety-first editorial style instead of a plain storefront landing page.

Goals:
- lead with safety, transparency, and trust
- keep the catalog visually strong without clutter
- preserve a simple ordering flow
- work well on mobile and desktop

## Current Visual System

- Typeface pairing: `Fraunces` for headings, `Manrope` for UI and body copy
- Palette: soft cream background, deep green primary, warm accent
- Surfaces: translucent cards with soft borders and gentle shadows
- Buttons: rounded, high-contrast, and full-width on mobile

## Homepage Structure

1. Safety-first hero with clear product transparency message
2. Supporting cards that explain the redesign
3. A short section on why the safety-first redesign matters
4. Footer branding kept minimal

## Product Page Structure

- Category filter chips
- Responsive product grid
- Real photo thumbnails per product
- Quick add-to-cart action

## Product Image Strategy

The product catalog now uses locally stored images from `assets/products/` rather than remote image URLs.

Each product should have:
- a photo that matches the item as closely as possible
- a file stored in `assets/products/`
- clear alt text
- a readable crop on desktop and mobile

## Data And Layout Notes

- Product data is stored in `data/products.json`
- The browser fallback catalog mirrors the same product list in `frontend/js/catalog.js`
- Cart and order state remain lightweight and file-backed
- Inline page styling was replaced with reusable classes wherever possible

## Pages

- `frontend/index.html`
- `frontend/products.html`
- `frontend/cart.html`
- `frontend/checkout.html`
- `frontend/success.html`

## Shared Styles

- `frontend/css/styles.css`

## Behavior Notes

- The products page falls back to local catalog data if the API is unavailable
- The catalog image paths are local so the storefront still works when offline or when remote image hosts are unavailable
- The checkout and success flows read from browser storage
- The app uses relative paths so pages work both from the server and as local files
