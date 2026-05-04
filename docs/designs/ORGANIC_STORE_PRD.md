# Siribhoomi Farm Organic Store PRD

## 1. Product Summary

Siribhoomi Farm and Organic Store is a small web storefront for local farm ordering. Customers can browse products, add items to a cart, register or log in, place delivery orders, and review their past orders. Owners can log in separately to view all orders and update fulfillment and payment state.

The product is optimized for a simple local workflow:

- clear product browsing
- short cart-to-checkout flow
- file-backed data that is easy to inspect
- owner order management without a separate admin product

## 2. Goals

- Make farm products easy to browse on desktop and mobile.
- Show product name, category, unit, stock, image, and price clearly.
- Require a logged-in customer before order placement.
- Clear the cart after a successful order.
- Show a clear order success message before and after redirect.
- Show customer orders in descending order by order timestamp.
- Give owners a private place to view and manage all orders.
- Keep the app simple enough to run locally with `npm start`.

## 3. Non-Goals

- Online payment processing.
- Inventory management screens for owners.
- Multi-store or multi-farm support.
- Production-grade authentication/session security.
- Database-backed persistence.
- Delivery tracking beyond order status labels.

## 4. Users

### Customer

Customers browse the catalog, add products to the cart, register or log in, place orders, and view previous orders.

### Owner

Owners use Owner Corner to log in with an owner/admin account, view order totals, inspect all orders, and update order status and payment status.

## 5. Primary User Flows

### Customer Shopping Flow

1. Customer lands on `index.html`.
2. Customer opens `products.html`.
3. Customer filters products by category if needed.
4. Customer adds products to the cart.
5. Customer reviews quantities on `cart.html`.
6. Customer continues to `checkout.html`.
7. Customer logs in if not already signed in.
8. Customer enters name, phone, and delivery address.
9. Backend validates the user, products, stock, and order payload.
10. Order is saved to `data/orders.json`.
11. Product stock is reduced in `data/products.json`.
12. Cart is cleared.
13. Checkout shows an order success message for 1.5 seconds, then redirects to `orders.html`.
14. Orders page shows the newest order at the top.

### Customer Order History Flow

1. Customer opens `orders.html`.
2. If not signed in, the customer is redirected to login.
3. Frontend calls `GET /orders?userId=...`.
4. Backend returns that customer's orders sorted newest first.
5. Page renders order ID, total, date, status, payment state, and items.

### Owner Order Management Flow

1. Owner opens Owner Corner.
2. Owner logs in through `owner-login.html`.
3. Owner is redirected to `admin-dashboard.html`.
4. Dashboard loads all orders with `GET /orders/admin?userId=...`.
5. Owner opens `admin-orders.html` to manage orders.
6. Owner updates order status through `PATCH /orders/admin/:orderId/status`.
7. Owner updates payment status through `PATCH /orders/admin/:orderId/payment-status`.
8. The order list refreshes after each successful update.

## 6. Pages

### `frontend/index.html`

Homepage for Siribhoomi Farm. It introduces the store, links to products and cart, and includes the shared navigation with Owner Corner.

### `frontend/products.html`

Product catalog page with category filters, product cards, stock labels, price/unit labels, images, and add-to-cart buttons. Uses the backend product API when available and falls back to `frontend/js/catalog.js` if the API is unavailable.

### `frontend/cart.html`

Cart review page with quantity steppers, remove controls, total price, and checkout entry point.

### `frontend/checkout.html`

Checkout form for customer name, phone, and address. Submits the order to the backend, clears the cart after success, shows a success message for 1.5 seconds, then redirects to the customer's order history.

### `frontend/success.html`

Fallback order confirmation page. Reads the latest order snapshot from `sessionStorage`, shows the order summary, and clears the cart as a backup.

### `frontend/orders.html`

Logged-in customer order history. Orders are shown newest first.

### `frontend/login.html`

Customer login page.

### `frontend/register.html`

Customer registration page. Shows a registration success message before redirecting to login.

### `frontend/owner-login.html`

Owner/admin login page. Only users with role `owner` or `admin` can continue.

### `frontend/admin-dashboard.html`

Owner summary page with total orders, pending orders, and delivered orders.

### `frontend/admin-orders.html`

Owner order management page with all orders, order status controls, and payment status controls.

## 7. Architecture

```text
Browser
  |
  | HTML/CSS/JS pages in frontend/
  | API calls through frontend/js/api.js
  v
Express server: backend/server.js
  |
  |-- static frontend files
  |-- /assets product images
  |-- /api/products
  |-- /api/customers/register
  |-- /auth and /users
  |-- /orders and /orders/admin
  v
JSON storage in data/
  |-- products.json
  |-- orders.json
  |-- users.json
```

### Frontend Architecture

- Plain HTML pages define structure.
- `frontend/css/styles.css` provides the shared design system.
- `frontend/js/api.js` centralizes API routes and fetch behavior.
- `frontend/js/cart.js` owns cart state in `localStorage`.
- `frontend/js/session.js` owns customer session state in `localStorage`.
- `frontend/js/owner-session.js` owns owner session state separately in `localStorage`.
- Page-specific scripts render and bind each screen.

### Backend Architecture

- `backend/server.js` configures Express, CORS, JSON body parsing, static files, and route mounting.
- `backend/routes/products.js` reads product catalog data.
- `backend/routes/customers.js` handles customer registration.
- `backend/routes/users.js` handles login, registration, and user lookup.
- `backend/routes/orders.js` handles customer order history, order creation, admin order listing, order status updates, and payment status updates.
- `backend/utils/fileStore.js` reads and writes JSON files with OneDrive-tolerant temp-file handling.
- `backend/utils/userStore.js` hashes passwords, verifies passwords, normalizes roles, and reads/writes users.

### Storage Architecture

The app uses JSON files:

- `data/products.json`: product catalog and stock counts
- `data/orders.json`: submitted orders
- `data/users.json`: users with hashed passwords and roles

The storage approach is intentionally simple. It is appropriate for local demos and prototype use, not for concurrent production traffic.

## 8. API Contract

### Products

- `GET /api/products`
- `GET /products`

Returns:

```json
{
  "success": true,
  "data": []
}
```

### Customer Registration

- `POST /api/customers/register`

Body:

```json
{
  "username": "customer1",
  "password": "password123"
}
```

### Login

- `POST /auth/login`

Body:

```json
{
  "username": "owner",
  "password": "owner"
}
```

Returns a sanitized user with `id`, `username`, `role`, and `createdAt`.

### Customer Orders

- `GET /orders?userId=...`
- `GET /orders?username=...`

Returns matching customer orders sorted newest first.

### Create Order

- `POST /orders`

Body:

```json
{
  "userId": "usr-123",
  "username": "customer1",
  "customerName": "Customer Name",
  "phone": "9876543210",
  "address": "Delivery address",
  "items": [
    {
      "productId": "prod-001",
      "quantity": 2
    }
  ]
}
```

### Admin Orders

- `GET /orders/admin?userId=...`
- `GET /orders/admin?username=...`

Requires an owner/admin identity. Returns all orders sorted newest first.

### Admin Status Updates

- `PATCH /orders/admin/:orderId/status`

Body:

```json
{
  "userId": "usr-owner-001",
  "status": "confirmed"
}
```

Allowed status values:

- `placed`
- `confirmed`
- `delivered`

### Admin Payment Updates

- `PATCH /orders/admin/:orderId/payment-status`

Body:

```json
{
  "userId": "usr-owner-001",
  "paymentStatus": "paid"
}
```

Allowed payment status values:

- `pending`
- `paid`

## 9. Data Models

### Product

```json
{
  "id": "prod-001",
  "name": "Organic Tomato",
  "price": 60,
  "category": "Vegetables",
  "image": "../assets/products/organic-tomato.jpg",
  "stock": 40,
  "description": "Fresh farm-grown tomatoes from Siribhoomi Farm.",
  "unit": "kg"
}
```

### User

```json
{
  "id": "usr-owner-001",
  "username": "owner",
  "role": "owner",
  "passwordHash": "...",
  "passwordSalt": "...",
  "passwordIterations": 100000,
  "passwordAlgorithm": "sha512",
  "createdAt": "2026-04-28T00:00:00.000Z"
}
```

### Order

```json
{
  "id": "ord-20260504-001",
  "userId": "usr-123",
  "username": "customer1",
  "customerName": "Customer Name",
  "phone": "9876543210",
  "address": "Delivery address",
  "items": [
    {
      "productId": "prod-001",
      "name": "Organic Tomato",
      "price": 60,
      "unit": "kg",
      "quantity": 2,
      "lineTotal": 120
    }
  ],
  "total": 120,
  "timestamp": "2026-05-04T15:29:14.391Z",
  "status": "placed",
  "paymentStatus": "pending"
}
```

## 10. Product Catalog

The current catalog contains 21 products across:

- Vegetables
- Fruits
- Grains
- Dairy
- Pantry

Product images are local files in `assets/products/`. The browser fallback catalog in `frontend/js/catalog.js` mirrors the product list so the products page can still render if the API is unavailable.

## 11. Current Constraints

- JSON file storage can be affected by OneDrive file locking.
- Passwords are hashed, but browser sessions are simple local storage objects.
- The backend has no database transactions, so product-stock and order writes are lightweight prototype logic.
- The owner dashboard is role-gated by API checks and browser session state, but it is not a production auth system.

## 12. Future Enhancements

- Move data into a database.
- Add proper server-side sessions or token-based authentication.
- Add owner product and stock management screens.
- Add search and sorting controls on the product catalog.
- Add order cancellation or refund flows.
- Add delivery date/time preferences.
- Add automated tests for order creation and owner updates.
