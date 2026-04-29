function formatAdminDate(timestamp) {
  if (!timestamp) {
    return 'Unknown date';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

function renderAdminItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<p class="muted">No items recorded.</p>';
  }

  return `
    <div class="order-items">
      ${items
        .map(
          (item) => `
            <div class="order-item-row">
              <div>
                <strong>${item.name}</strong>
                <div class="muted">${item.quantity} x ${OrganicStoreCart.formatCurrency(item.price)} / ${item.unit}</div>
              </div>
              <strong>${OrganicStoreCart.formatCurrency(item.lineTotal)}</strong>
            </div>
          `
        )
        .join('')}
    </div>
  `;
}

function renderOrders(orders) {
  const listNode = document.getElementById('admin-orders-list');
  const emptyNode = document.getElementById('admin-orders-empty');
  const countNode = document.querySelector('[data-admin-order-count]');

  if (!listNode || !emptyNode) {
    return;
  }

  if (countNode) {
    countNode.textContent = String(orders.length);
  }

  if (!orders.length) {
    listNode.innerHTML = '';
    emptyNode.hidden = false;
    return;
  }

  emptyNode.hidden = true;
  listNode.innerHTML = orders
    .map(
      (order) => `
        <article class="panel panel-pad order-card">
          <div class="order-card-head">
            <div>
              <div class="eyebrow">Order ${order.id}</div>
              <h3>${order.customerName}</h3>
              <p class="muted">${order.username || order.userId || 'Unknown user'}</p>
            </div>
            <div class="order-meta">
              <span class="badge">${String(order.status || 'placed').toUpperCase()}</span>
              <span class="badge">${String(order.paymentStatus || 'pending').toUpperCase()}</span>
              <strong>${OrganicStoreCart.formatCurrency(order.total || 0)}</strong>
              <span class="muted">${formatAdminDate(order.timestamp)}</span>
            </div>
          </div>

          <div class="order-grid">
            <section class="order-section">
              <strong>Customer</strong>
              <p class="muted">${order.customerName}</p>
              <p class="muted">${order.phone}</p>
              <p class="muted">${order.address}</p>
            </section>
            <section class="order-section">
              <strong>Items</strong>
              ${renderAdminItems(order.items)}
            </section>
          </div>

          <div class="order-status-bar">
            <label class="field-group compact">
              <span>Order status</span>
              <select data-order-status-select="${order.id}">
                <option value="placed" ${String(order.status) === 'placed' ? 'selected' : ''}>Placed</option>
                <option value="confirmed" ${String(order.status) === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                <option value="delivered" ${String(order.status) === 'delivered' ? 'selected' : ''}>Delivered</option>
              </select>
            </label>
            <button type="button" class="button button-primary" data-action="save-order-status" data-order-id="${order.id}">
              Save Status
            </button>
            <label class="field-group compact">
              <span>Payment status</span>
              <select data-order-payment-select="${order.id}">
                <option value="pending" ${String(order.paymentStatus) !== 'paid' ? 'selected' : ''}>Pending</option>
                <option value="paid" ${String(order.paymentStatus) === 'paid' ? 'selected' : ''}>Paid</option>
              </select>
            </label>
            <button type="button" class="button button-secondary" data-action="save-payment-status" data-order-id="${order.id}">
              Save Payment
            </button>
          </div>
        </article>
      `
    )
    .join('');
}

async function loadOrders() {
  const owner = window.OrganicStoreOwnerSession.requireOwnerSession();
  if (!owner) {
    return;
  }

  try {
    const response = await OrganicStoreAPI.getAdminOrders({
      userId: owner.id,
      sort: 'recent'
    });
    renderOrders(response.data || []);
  } catch (error) {
    const listNode = document.getElementById('admin-orders-list');
    const emptyNode = document.getElementById('admin-orders-empty');
    if (listNode) {
      listNode.innerHTML = '';
    }
    if (emptyNode) {
      emptyNode.hidden = false;
      emptyNode.innerHTML = `
        <h3>Unable to load orders</h3>
        <p class="muted">${error.message}</p>
      `;
    }
  }
}

function renderOwnerSessionSlot() {
  const slot = document.querySelector('[data-owner-session-slot]');
  if (!slot) {
    return;
  }

  const owner = window.OrganicStoreOwnerSession.getOwnerSession();
  if (!owner) {
    slot.innerHTML = `<a class="session-link" href="owner-login.html">Owner Login</a>`;
    return;
  }

  slot.innerHTML = `
    <span class="session-chip">Owner: ${owner.username}</span>
    <button type="button" class="button button-secondary session-button" data-action="owner-logout">Logout</button>
  `;
}

async function handleStatusActions(event) {
  const statusButton = event.target.closest('[data-action="save-order-status"]');
  const paymentButton = event.target.closest('[data-action="save-payment-status"]');

  if (!statusButton && !paymentButton) {
    return;
  }

  const owner = window.OrganicStoreOwnerSession.getOwnerSession();
  if (!owner) {
    return;
  }

  const button = statusButton || paymentButton;
  const orderId = button.dataset.orderId;

  button.disabled = true;
  button.textContent = 'Saving...';

  try {
    if (statusButton) {
      const select = document.querySelector(`[data-order-status-select="${orderId}"]`);
      await OrganicStoreAPI.updateOrderStatus(orderId, {
        status: select ? select.value : 'placed',
        userId: owner.id
      });
    } else {
      const select = document.querySelector(`[data-order-payment-select="${orderId}"]`);
      await OrganicStoreAPI.updateOrderPaymentStatus(orderId, {
        paymentStatus: select ? select.value : 'pending',
        userId: owner.id
      });
    }

    await loadOrders();
  } catch (error) {
    button.disabled = false;
    button.textContent = statusButton ? 'Save Status' : 'Save Payment';
    window.alert(error.message);
  }
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="owner-logout"]');
  if (!button) {
    return;
  }

  window.OrganicStoreOwnerSession.clearOwnerSession();
  window.location.href = 'owner-login.html';
});

document.addEventListener('click', handleStatusActions);

document.addEventListener('DOMContentLoaded', () => {
  const owner = window.OrganicStoreOwnerSession.requireOwnerSession();
  if (!owner) {
    return;
  }

  renderOwnerSessionSlot();
  loadOrders();
});
