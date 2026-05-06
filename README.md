# Siribhoomi Farm and Organic Store

Siribhoomi Farm and Organic Store is a lightweight web storefront for browsing farm products, adding items to a cart, placing orders, and managing orders from an owner dashboard.

The project is built as a simple HTML/CSS/JavaScript frontend served by a Node.js and Express backend. Data is stored in JSON files, which keeps the app easy to run locally and easy to inspect while developing.

## Website Overview

The website supports two main audiences:

- Customers who browse products, register or log in, place orders, and review their order history.
- Owners who log in through Owner Corner, review all orders, and update order and payment status.

Core pages:

- `Home`: introduces Siribhoomi Farm and links into the shopping flow.
- `Products`: shows the product catalog with category filters and add-to-cart controls.
- `Cart`: lets customers review quantities, remove items, and proceed to checkout.
- `Checkout`: captures delivery details, places the order, clears the cart, and redirects to order history.
- `Success`: fallback confirmation page for the last order snapshot.
- `Orders`: shows the logged-in customer's orders, newest first.
- `Owner Corner`: owner login for private order management.
- `Admin Dashboard`: owner summary for total, pending, and delivered orders.
- `Manage Orders`: owner order list with status and payment controls.

## Features

- Local product catalog with 21 products and real product images.
- Category filtering on the products page.
- Browser cart stored in `localStorage`.
- Customer registration and login with hashed passwords.
- Order creation tied to a user account.
- Cart clearing after successful order placement.
- Customer order history sorted by newest order first.
- Owner dashboard and order management.
- Owner updates for order status: `placed`, `confirmed`, `delivered`.
- Owner updates for payment status: `pending`, `paid`.
- JSON-backed storage for products, users, and orders.

## Tech Stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js, Express
- Storage: JSON files in `data/`
- Assets: local product images in `assets/products/`

## Project Structure

```text
organic_store/
  assets/products/        Product images
  backend/
    routes/               Express route handlers
    utils/                JSON storage and user helpers
    server.js             App entry point
  data/
    products.json         Product catalog
    orders.json           Order records
    users.json            User records with hashed passwords
  docs/designs/
    ORGANIC_STORE_PRD.md  Product and architecture notes
  frontend/
    css/styles.css        Shared website styles
    js/                   Page behavior and API client
    *.html                Website pages
```

## Run Locally

Install dependencies:

```powershell
npm install
```

Start the backend and static frontend server:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:3000/
```

If you serve the `frontend/` folder separately, for example with VS Code Live Server on port `5500`, set `frontend/js/config.js` to:

```js
window.APP_CONFIG = {
  API_BASE_URL: "http://localhost:3000"
};
```

The backend allows local frontend origins `http://localhost:5500` and `http://127.0.0.1:5500` by default.

## Frontend API Configuration

GitHub Pages serves static files and cannot read `.env` at runtime. The frontend backend URL is controlled only by `frontend/js/config.js`.

For local backend testing:

```js
window.APP_CONFIG = {
  API_BASE_URL: "http://localhost:3000"
};
```

For the Render backend:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://organic-store-kb76.onrender.com"
};
```

All frontend API calls go through `frontend/js/api.js`, which reads `window.APP_CONFIG.API_BASE_URL`.

## Render Backend Deployment

Create a Render Web Service for the repository.

Use these settings:

```text
Build Command: npm install
Start Command: npm start
```

Set Render environment variables:

```text
PORT=3000
ALLOWED_ORIGINS=http://localhost:5500,http://127.0.0.1:5500,https://spoortichetana1.github.io
```

Render may provide its own `PORT`; the backend uses `process.env.PORT || 3000`.

The live GitHub Pages site is `https://spoortichetana1.github.io/organic_store/frontend/index.html`, but CORS must use only the origin: `https://spoortichetana1.github.io`. If you use a custom domain later, add that exact origin too.

The backend exposes a health check:

```text
GET /health
```

## GitHub Pages Frontend Deployment

Before deploying to GitHub Pages, set `frontend/js/config.js` to the Render backend URL:

```js
window.APP_CONFIG = {
  API_BASE_URL: "https://organic-store-kb76.onrender.com"
};
```

Deploy the `frontend/` directory through GitHub Pages. The production URL is:

```text
https://spoortichetana1.github.io/organic_store/frontend/index.html
```

The deployed site should call Render through `config.js`; it should only call localhost when `config.js` is intentionally switched back for local testing.

## Default Owner Login

Use Owner Corner to open the owner login page.

## Important API Routes

- `GET /api/products`: product catalog
- `POST /api/customers/register`: customer registration
- `POST /auth/login`: customer or owner login
- `GET /orders?userId=...`: customer orders, newest first
- `POST /orders`: create order
- `GET /orders/admin?userId=...`: all orders for owner/admin, newest first
- `PATCH /orders/admin/:orderId/status`: update order status
- `PATCH /orders/admin/:orderId/payment-status`: update payment status

## Data Notes

This project intentionally uses JSON files instead of a database. That makes local development simple, but it is not intended for concurrent production traffic. If this site grows beyond a local or prototype workflow, the next step should be moving users, products, and orders into a database.
