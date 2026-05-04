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

## Backend URL Configuration

The project includes `.env` as the source note for the backend URL:

```text
API_BASE_URL=http://127.0.0.1:3000
# API_BASE_URL=https://organic-store-api.onrender.com
```

Because GitHub Pages serves static files, it cannot read `.env` at runtime. Before deploying the frontend to GitHub Pages, update `frontend/js/api.js`:

```js
// const API_BASE_URL = 'http://127.0.0.1:3000';
const API_BASE_URL = 'https://organic-store-api.onrender.com';
```

For local development, keep the local line active.

## Default Owner Login

Use Owner Corner to open the owner login page.

```text
Username: owner
Password: owner
```

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
