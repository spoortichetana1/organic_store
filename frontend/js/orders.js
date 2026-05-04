function formatOrderDate(timestamp) {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
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

function renderStatusBadge(status) {
  const normalizedStatus = normalizeStatus(status, 'placed');
  return `<span class="status-badge" data-status="${normalizedStatus}">${formatStatusLabel(normalizedStatus)}</span>`;
}

function renderPaymentBadge(paymentStatus) {
  const normalizedStatus = normalizeStatus(paymentStatus, 'pending');
  return `<span class="status-badge" data-status="${normalizedStatus}">${formatStatusLabel(normalizedStatus)}</span>`;
}

function getOrdersContainer() {
  return document.getElementById('orders-list');
}

function getOrdersEmptyState() {
  return document.getElementById('orders-empty');
}

function renderOrderItems(items) {
  return (items || [])
    .map(
      (item) => `
        <div class="order-item-row">
          <div>
            <strong>${item.name}</strong>
            <div class="muted">${item.quantity} x ${OrganicStoreCart.formatCurrency(item.price)}</div>
          </div>
          <strong>${OrganicStoreCart.formatCurrency(item.price * item.quantity)}</strong>
        </div>
      `
    )
    .join('');
}

function renderOrders(orders) {
  const container = getOrdersContainer();
  const emptyState = getOrdersEmptyState();

  if (!container) {
    return;
  }

  if (!orders || orders.length === 0) {
    container.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
    }
    return;
  }

  if (emptyState) {
    emptyState.hidden = true;
  }

  container.innerHTML = orders
    .map(
      (order) => `
        <article class="panel panel-pad order-card">
          <div class="order-card-head">
            <div>
              <div class="eyebrow actions-center">Order ${order.id}</div>
              <h3>${order.id}</h3>
            </div>
            <div class="order-meta">
              <strong>${OrganicStoreCart.formatCurrency(order.total || 0)}</strong>
              <span class="status-badge" data-status="date">${formatOrderDate(order.timestamp)}</span>
            </div>
          </div>
          <div class="order-grid">
            <div class="order-section">
              <div class="status-pair">
                <strong>Order status</strong>
                ${renderStatusBadge(order.status)}
                <strong>Payment status</strong>
                ${renderPaymentBadge(order.paymentStatus)}
              </div>
            </div>
            <div class="order-section">
              <strong>Items</strong>
              <div class="order-items">${renderOrderItems(order.items)}</div>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

async function loadUserOrders() {
  const container = getOrdersContainer();
  if (!container) {
    return;
  }

  const user = window.OrganicStoreSession.requireLogin();
  if (!user) {
    return;
  }

  container.innerHTML = `
    <div class="panel panel-pad empty-state">
      <h3>Loading orders...</h3>
      <p class="muted">Please wait a moment.</p>
    </div>
  `;

  try {
    const response = await OrganicStoreAPI.getOrders({ userId: user.id });
    renderOrders(response.data || []);
  } catch (error) {
    container.innerHTML = `
      <div class="panel panel-pad empty-state">
        <h3>Unable to load orders</h3>
        <p class="muted">${error.message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserOrders();
});
