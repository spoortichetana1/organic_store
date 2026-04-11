# Organic Store PRD + System Design

## 1. Product Overview

### What is Organic Store?
Organic Store is a simple web application for Siribhoomi Farm that lets customers browse organic farm products, add items to a cart, and place an order through a lightweight checkout flow.

### Problem Statement
Customers who want to buy organic products from Siribhoomi Farm need a simple way to view available items, understand pricing and units, and submit an order without calling or messaging manually.

### Why This Product Exists
- To make Siribhoomi Farm products easy to discover and order online.
- To reduce manual order-taking over phone or chat.
- To give the farm a clean digital ordering presence with minimal operational overhead.

### Value Proposition
- For customers: faster ordering, transparent product details, and a straightforward checkout experience.
- For the farm: fewer missed orders, centralized order capture, and a low-cost MVP that is easy to maintain.

## 2. Target Users

### Who Are the Users?
Primary users are local customers who want to buy organic produce and farm goods from Siribhoomi Farm.

### Needs and Behaviors
- Want to browse products quickly on mobile.
- Need clear product photos, prices, and units.
- Prefer a short order form with minimal fields.
- May order small quantities and repeat purchases frequently.

### Key Pain Points
- Unclear product availability.
- No structured ordering flow.
- Confusing quantity/unit information.
- Too many steps before placing an order.

## 3. User Journey

### Step-by-Step Flow
1. **Landing**
   - User opens Organic Store home page.
   - Sees Siribhoomi Farm branding, featured products, and a clear call to browse products.
2. **Browse**
   - User navigates to the products page.
   - Reviews product cards with image, name, price, unit, category, stock, and short description.
3. **Add to Cart**
   - User opens a product detail view or uses quick add from the product card.
   - Chooses quantity and adds the item to the cart.
4. **Checkout**
   - User reviews cart contents.
   - Enters name, phone number, and delivery address.
   - Confirms the order.
5. **Order Success**
   - System shows order confirmation with order ID and summary.
   - User gets a clear success state and next-step message.

## 4. Core Features (MVP Scope)

### 4.1 Product Listing
**Description:** Show all available Siribhoomi Farm products in a browsable catalog.

**Inputs:**
- Product data from backend
- Category filter selection

**Outputs:**
- Product grid/list with name, price, unit, image, stock, and availability

**User Interaction:**
- Browse products
- Open product details
- Add item to cart

### 4.2 Product Details
**Description:** Show full product information for a selected item.

**Inputs:**
- Selected product ID
- Product data

**Outputs:**
- Full product page or modal with description, price, unit, stock, and add-to-cart control

**User Interaction:**
- Read details
- Choose quantity
- Add to cart

### 4.3 Cart
**Description:** Store chosen products before checkout.

**Inputs:**
- Selected products
- Quantities
- Remove/update actions

**Outputs:**
- Cart summary with line items and total

**User Interaction:**
- Increase/decrease quantity
- Remove item
- Proceed to checkout

### 4.4 Checkout
**Description:** Collect customer details needed to place an order.

**Inputs:**
- Customer name
- Phone number
- Delivery address
- Cart items

**Outputs:**
- Order submission request
- Validation messages if data is incomplete

**User Interaction:**
- Fill form
- Review order total
- Submit order

### 4.5 Order Placement
**Description:** Save the order and confirm success.

**Inputs:**
- Customer information
- Cart items
- Total amount

**Outputs:**
- Stored order record
- Order ID
- Success confirmation page

**User Interaction:**
- View success message
- Note order reference

## 5. Out of Scope

The following are explicitly not part of the MVP:
- User login or signup
- Customer accounts or profiles
- Online payment gateway integration
- Delivery tracking or rider assignment
- Refunds, cancellations, or returns workflow
- Inventory forecasting
- Admin analytics dashboard
- Coupons, promotions, or loyalty points
- Advanced search, recommendations, or AI features
- Push notifications, SMS automation, or WhatsApp automation
- Multi-vendor support

## 6. UI/UX Design Structure

### Home Page
**Sections / Components**
- Header with Organic Store / Siribhoomi Farm branding
- Hero section with short value proposition
- Featured products section
- Short trust section: fresh, organic, farm-direct
- CTA button to browse products

**Layout Description**
- Mobile-first single-column layout
- Hero at top, followed by featured products and trust cues
- Primary CTA always visible near top

**Key UI Elements**
- Product images
- Primary browse button
- Highlighted categories

### Products Page
**Sections / Components**
- Header and navigation
- Category filter chips
- Search field optional for MVP if easy to implement
- Product grid/list
- Quick add to cart action

**Layout Description**
- Desktop: 2-4 column responsive product grid
- Mobile: single-column stacked cards

**Key UI Elements**
- Product card
- Price and unit label
- Stock badge
- Add to cart button

### Cart Page
**Sections / Components**
- Cart line items
- Quantity controls
- Remove item action
- Order summary
- Proceed to checkout button

**Layout Description**
- Items in a vertical list
- Summary fixed at bottom on mobile if possible

**Key UI Elements**
- Item thumbnail
- Quantity stepper
- Subtotal and total

### Checkout Page
**Sections / Components**
- Customer details form
- Order summary
- Submit order button

**Layout Description**
- Form first for mobile speed
- Summary visible below or beside form on desktop

**Key UI Elements**
- Name field
- Phone field
- Address field
- Validation messages
- Place order button

### Success Page
**Sections / Components**
- Confirmation message
- Order ID
- Order summary
- Next-step instruction

**Layout Description**
- Clean centered confirmation screen
- Minimal distraction

**Key UI Elements**
- Success icon
- Order reference
- Return to shop button

## 7. Data Model Design

### Product Object
```json
{
  "id": "prod-001",
  "name": "Organic Tomato",
  "price": 60,
  "category": "Vegetables",
  "image": "/assets/products/organic-tomato.jpg",
  "stock": 40,
  "description": "Fresh farm-grown organic tomatoes from Siribhoomi Farm.",
  "unit": "kg"
}
```

### Order Object
```json
{
  "id": "ord-20260411-001",
  "customerName": "Anita Sharma",
  "phone": "9876543210",
  "address": "12 Green Street, Bangalore",
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
  "timestamp": "2026-04-11T09:30:00.000Z",
  "status": "placed"
}
```

### Data Notes
- `price` should be stored as a number in local currency units.
- `stock` is informational for MVP; it can be decremented on order placement if desired.
- `status` can remain simple: `placed`, `confirmed`, `cancelled` if later needed.

## 8. System Architecture

### Chosen Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Storage:** JSON files

### Why Node.js + Express?
Node.js + Express is the simplest fit for this MVP because:
- The frontend and backend can both use JavaScript.
- It is easy to expose small JSON APIs.
- It is lightweight enough for a low-complexity ordering site.
- It works well with file-based storage for an early-stage product.

### High-Level Architecture
- The frontend renders pages and handles cart state in the browser.
- The backend serves product data and accepts order submissions.
- JSON files store products and orders locally on the server.

### Request / Response Flow
1. Browser loads the frontend.
2. Frontend requests products from `GET /products`.
3. Backend reads `data/products.json` and returns product JSON.
4. User adds items to cart in browser state.
5. On checkout, frontend sends order payload to `POST /orders`.
6. Backend validates request, creates order ID, appends order to `data/orders.json`, and returns confirmation.
7. Frontend shows the success page with order reference.

## 9. API Design

### GET /products
Returns all available products.

**Request**
```http
GET /products
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "prod-001",
      "name": "Organic Tomato",
      "price": 60,
      "category": "Vegetables",
      "image": "/assets/products/organic-tomato.jpg",
      "stock": 40,
      "description": "Fresh farm-grown organic tomatoes from Siribhoomi Farm.",
      "unit": "kg"
    }
  ]
}
```

### POST /orders
Creates a new order.

**Request**
```json
{
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
  "total": 120
}
```

**Response**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "id": "ord-20260411-001",
    "status": "placed",
    "total": 120,
    "timestamp": "2026-04-11T09:30:00.000Z"
  }
}
```

### GET /orders Optional Admin Endpoint
Returns all orders for simple internal review.

**Request**
```http
GET /orders
```

**Response**
```json
{
  "success": true,
  "data": [
    {
      "id": "ord-20260411-001",
      "customerName": "Anita Sharma",
      "phone": "9876543210",
      "address": "12 Green Street, Bangalore",
      "items": [],
      "total": 120,
      "timestamp": "2026-04-11T09:30:00.000Z",
      "status": "placed"
    }
  ]
}
```

## 10. Project Structure

```text
organic_store/
├── frontend/
│   ├── index.html
│   ├── products.html
│   ├── cart.html
│   ├── checkout.html
│   ├── success.html
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── api.js
│       ├── cart.js
│       ├── home.js
│       ├── products.js
│       ├── checkout.js
│       └── success.js
├── backend/
│   ├── server.js
│   ├── routes/
│   │   ├── products.js
│   │   └── orders.js
│   ├── services/
│   │   ├── productService.js
│   │   └── orderService.js
│   └── utils/
│       └── fileStore.js
├── assets/
│   ├── images/
│   └── products/
└── data/
    ├── products.json
    └── orders.json
```

### Practical Notes for VS Code
- Keep frontend pages separate for clarity during MVP implementation.
- Keep backend route files small and focused.
- Store sample data in `data/products.json` for easy editing without a database.
- Use `assets/products/` for product images so the frontend can reference stable paths.

## 11. Non-Functional Requirements

### Performance
- Home and product pages should load quickly on mobile networks.
- Product data should be small and cached in the browser where possible.
- JSON file reads should remain lightweight because product and order volume is expected to be low in MVP.

### Simplicity
- Avoid unnecessary abstractions.
- Use plain HTML/CSS/JS where possible.
- Keep backend code path count small.

### Mobile Responsiveness
- All pages must work well on mobile first.
- Buttons must be large enough for touch interaction.
- Product cards and checkout fields must stack vertically on small screens.

### Basic Security
- Validate required order fields on backend.
- Sanitize text inputs to reduce malformed requests.
- Do not expose file paths or internal stack traces in API responses.
- If admin endpoints are used, they should be kept private in deployment.

## 12. Phased Development Plan

### Phase 1: Frontend Only
**Tasks**
- Build static pages for home, products, cart, checkout, and success.
- Implement responsive layout and styles.
- Add local cart state using browser storage.
- Use mock product data.

**Outputs**
- Clickable prototype
- Responsive UI
- End-to-end flow with mock data

### Phase 2: Backend Integration
**Tasks**
- Create Express server.
- Implement `GET /products`.
- Implement `POST /orders`.
- Connect frontend to backend APIs.
- Store orders in JSON file.

**Outputs**
- Real product loading from backend
- Real order submission
- Persistent order records

### Phase 3: Improvements
**Tasks**
- Add simple admin order viewing if needed.
- Improve validation and error handling.
- Refine image handling and product categorization.
- Add lightweight UX enhancements such as loading states and empty cart states.

**Outputs**
- More stable MVP
- Better operational usability
- Cleaner order management experience

## 13. Risks & Simplifications

### What Can Go Wrong
- JSON file writes can fail if the server is interrupted during save.
- Stock counts can become inaccurate if multiple orders happen at the same time.
- Customers may submit incomplete or invalid contact details.
- Order volume may outgrow simple file storage later.

### What Is Intentionally Simplified
- No authentication.
- No payment processing.
- No complex inventory engine.
- No database.
- No delivery workflow.
- No advanced admin panel.
- No personalization or recommendation logic.

## Implementation Notes

- Keep cart state in browser storage until checkout.
- Use a single source of truth for product data in `data/products.json`.
- Return predictable JSON structures so the frontend can remain simple.
- Prefer readable code over abstraction because this is an MVP for direct implementation.
