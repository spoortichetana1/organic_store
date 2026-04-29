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

1. Large Siribhoomi Farm hero with a short intro and clear CTA to products
2. Colorful visual panel using a local background image
3. Compact supporting cards that explain the buying flow
4. Minimal footer branding

## Product Page Structure

- Category filter chips
- Responsive product grid
- Real photo thumbnails per product
- Quick add-to-cart action
- Visible cart count chip on the page

## Orders Page Structure

- Logged-in user order history
- Clean card layout for order ID, items, total, status, and date
- Mobile-friendly stacking of order details

## Product Image Strategy

The product catalog now uses locally stored images from `assets/products/` rather than remote image URLs.

Each product should have:
- a photo that matches the item as closely as possible
- a file stored in `assets/products/`
- clear alt text
- a readable crop on desktop and mobile

## Data And Layout Notes

- Product data is stored in `data/products.json`
- User data is stored in `data/users.json`
- User registration uses `POST /users/register`
- User login uses `POST /users/login` and returns the stored role
- Order creation requires a valid logged-in user reference
- Order records now carry both order status and payment status
- Order listing supports filtering by `userId` or `username`
- Admin order listing uses `GET /orders/admin` and returns all orders, sorted newest first by default
- Admin order status updates use `PATCH /orders/admin/:orderId/status`
- Admin payment status updates use `PATCH /orders/admin/:orderId/payment-status`
- Session state is stored in browser storage and the header swaps to a logout control when signed in
- Owner or admin users are distinguished by the `role` field in the session object
- The frontend includes `frontend/orders.html` and `frontend/js/orders.js` for order history
- Owner access uses separate pages: `frontend/owner-login.html` and `frontend/admin-dashboard.html`
- Order management is handled by `frontend/admin-orders.html` and `frontend/js/admin-orders.js`
- The admin dashboard shows total, pending, and delivered order counts using a minimal card layout
- The admin dashboard pulls its counts from the admin orders API and avoids extra controls
- The owner session is stored separately from the customer session to keep the UI split cleanly
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
- The catalog currently shows 21 products across vegetables, fruits, grains, dairy, and pantry
- The checkout and success flows read from browser storage
- The app uses relative paths so pages work both from the server and as local files
