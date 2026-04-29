# Organic Store Product Brief

## 1. Overview

Organic Store is a web storefront for Siribhoomi Farm. The current version focuses on safe ordering, clearer product presentation, and a simple cart-to-checkout flow.

The storefront now emphasizes:
- food handling and transparency
- real product photography
- category browsing and quick add-to-cart
- lightweight order capture without account creation

## 2. Product Goals

- Make it easy to browse farm products on mobile and desktop
- Present products with clear unit, category, stock, and price labels
- Keep checkout short and low-friction
- Support the app even when the backend is not running by falling back to local catalog data

## 3. Key User Flow

1. Open the home page and read the safety-first message
2. Move into the products page and filter by category if needed
3. Add one or more items to the cart
4. Review quantities and totals on the cart page
5. Enter name, phone, and address during checkout
6. See the success page with the order summary

## 4. Current UI Structure

### Home Page
- Large Siribhoomi Farm hero with a short farm overview
- Colorful background panel and clear CTA into the catalog
- Compact supporting cards that explain the buying flow

### Products Page
- Category filter chips
- Responsive product grid
- Real product photography
- Quick add-to-cart button on each card
- Visible cart count chip on the page

### Cart Page
- Quantity steppers
- Remove controls
- Order total summary
- Checkout button

### Checkout Page
- Name, phone, and address form
- Cart summary alongside the form
- Submit order action with validation feedback

### Success Page
- Order confirmation
- Order ID, items, total, and delivery address
- Return-to-shop actions

### Orders Page
- Lists the logged-in user's past orders
- Shows order ID, items, total, status, and date
- Uses a simple card layout for quick scanning

## 5. Data Model

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

### Order
```json
{
  "id": "ord-20260411-001",
  "userId": "usr-123",
  "username": "Anita",
  "customerName": "Anita Sharma",
  "phone": "9876543210",
  "address": "12 Green Street, Bangalore",
  "items": [
    {
      "productId": "prod-001",
      "name": "Organic Tomato",
      "price": 60,
      "unit": "kg",
      "quantity": 2
    }
  ],
  "total": 120,
  "timestamp": "2026-04-11T09:30:00.000Z",
  "status": "placed"
}
```

## 6. Architecture

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Storage: JSON files
- User accounts: file-backed user store with hashed passwords and a `role` field
- Registration endpoint: `POST /users/register` with username/password validation
- Login endpoint: `POST /users/login` with credential verification and role-aware responses
- Orders include a user reference, status, and payment status, and validate the user before saving
- Login state is kept in browser storage and can be cleared with logout
- Owner or admin users can be identified through the stored role value
- Product loading: backend API when available, local catalog fallback otherwise
- Order placement: POST request to the backend, then render success state
- Order retrieval: `GET /orders?userId=...` or `GET /orders?username=...` for a single user
- Admin order retrieval: `GET /orders/admin?sort=recent` for all orders in the system
- Admin order status update: `PATCH /orders/admin/:orderId/status` with `placed`, `confirmed`, or `delivered`
- Admin payment status update: `PATCH /orders/admin/:orderId/payment-status` with `pending` or `paid`
- The frontend includes a dedicated order-history page for logged-in users
- The frontend includes a minimal admin dashboard showing total, pending, and delivered orders
- The frontend includes a separate admin order manager page for owners
- The admin dashboard reads from the admin orders API and stays intentionally minimal

## 7. Product Catalog

The current catalog contains 21 items across:
- Vegetables
- Fruits
- Grains
- Dairy
- Pantry

The product set now includes:
- Organic Tomato
- Fresh Spinach
- Tender Carrot
- Sweet Mango
- Organic Banana
- Red Apple
- Brown Rice
- Whole Wheat Flour
- Cow Milk
- Raw Honey
- Organic Cucumber
- Farm Cauliflower
- Free Range Eggs
- Ripe Avocado
- Fresh Herbs Mix
- Farm Potato
- Red Onion
- Garlic Cloves
- Lemon
- Local Yogurt
- Paneer

## 8. Implementation Notes

- Product data exists in `data/products.json`
- The frontend has a local fallback catalog in `frontend/js/catalog.js`
- Product cards use local images from `assets/products/` instead of remote image URLs
- The landing page now leads with safety, not generic store marketing
- The visual design uses a soft editorial layout with strong spacing and card hierarchy

## 9. File Map

- `frontend/index.html`
- `frontend/products.html`
- `frontend/cart.html`
- `frontend/checkout.html`
- `frontend/orders.html`
- `frontend/login.html`
- `frontend/owner-login.html`
- `frontend/admin-dashboard.html`
- `frontend/register.html`
- `frontend/success.html`
- `frontend/css/styles.css`
- `frontend/js/api.js`
- `frontend/js/cart.js`
- `frontend/js/catalog.js`
- `frontend/js/session.js`
- `frontend/js/auth.js`
- `frontend/js/owner-session.js`
- `frontend/js/owner-auth.js`
- `frontend/js/admin-dashboard.js`
- `frontend/js/orders.js`
- `frontend/js/products.js`
- `frontend/js/checkout.js`
- `frontend/js/success.js`
- `backend/server.js`
- `backend/routes/products.js`
- `backend/routes/orders.js`
- `data/products.json`
- `data/orders.json`
