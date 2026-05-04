function readLastOrder() {
  try {
    const raw = sessionStorage.getItem(OrganicStoreCart.LAST_ORDER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function normalizeStatus(value, fallback) {
  return String(value || fallback).trim().toLowerCase();
}

function formatStatusLabel(value) {
  return String(value || '')
    .trim()
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderSuccess() {
  const container = document.getElementById('success-content');
  if (!container) {
    return;
  }

  OrganicStoreCart.clearCart();

  const order = readLastOrder();
  if (!order) {
    container.innerHTML = `
      <div class="panel panel-pad success-state">
        <h1>Order placed successfully</h1>
        <p class="muted">No order summary is available in this session.</p>
        <div class="page-actions actions-center">
          <a class="button button-primary" href="products.html">Browse Products</a>
          <a class="button button-secondary" href="index.html">Home</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="panel panel-pad success-state">
      <div class="eyebrow actions-center">Order Confirmed</div>
      <h1>Order placed successfully</h1>
      <p class="muted">Thank you, ${order.customerName}. Your order has been placed with Siribhoomi Farm.</p>

      <div class="panel panel-pad mt-20 text-left">
        <div class="summary-row"><strong>Order ID</strong><span>${order.id}</span></div>
        <div class="summary-row"><strong>Phone</strong><span>${order.phone}</span></div>
        <div class="summary-row"><strong>Total</strong><span>${OrganicStoreCart.formatCurrency(order.total)}</span></div>
        <div class="summary-row">
          <strong>Status</strong>
          <span class="status-badge" data-status="${normalizeStatus(order.status, 'placed')}">${formatStatusLabel(normalizeStatus(order.status, 'placed'))}</span>
        </div>
        <div class="mt-12">
          <strong>Delivery Address</strong>
          <p class="muted">${order.address}</p>
        </div>
      </div>

      <div class="panel panel-pad mt-20 text-left">
        <strong>Items</strong>
        <div class="summary-list mt-12">
          ${(order.items || [])
            .map(
              (item) => `
                <div class="summary-row">
                  <span>${item.name} x ${item.quantity}</span>
                  <strong>${OrganicStoreCart.formatCurrency(item.price * item.quantity)}</strong>
                </div>
              `
            )
            .join('')}
        </div>
      </div>

      <div class="page-actions actions-center">
        <a class="button button-primary" href="products.html">Shop More</a>
        <a class="button button-secondary" href="index.html">Back to Home</a>
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', renderSuccess);
