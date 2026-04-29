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

function setMetric(selector, value) {
  const node = document.querySelector(selector);
  if (node) {
    node.textContent = String(value);
  }
}

function summarizeOrders(orders) {
  const summary = {
    total: orders.length,
    pending: 0,
    delivered: 0
  };

  orders.forEach((order) => {
    const status = String(order.status || '').trim().toLowerCase();
    if (status === 'delivered') {
      summary.delivered += 1;
    }
    if (status === 'placed' || status === 'confirmed') {
      summary.pending += 1;
    }
  });

  return summary;
}

async function loadDashboard() {
  const owner = window.OrganicStoreOwnerSession.requireOwnerSession();
  if (!owner) {
    return;
  }

  try {
    const response = await OrganicStoreAPI.getAdminOrders({
      userId: owner.id,
      sort: 'recent'
    });
    const orders = response.data || [];
    const summary = summarizeOrders(orders);

    setMetric('[data-metric-total]', summary.total);
    setMetric('[data-metric-pending]', summary.pending);
    setMetric('[data-metric-delivered]', summary.delivered);
  } catch (error) {
    setMetric('[data-metric-total]', 0);
    setMetric('[data-metric-pending]', 0);
    setMetric('[data-metric-delivered]', 0);
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

document.addEventListener('DOMContentLoaded', () => {
  const owner = window.OrganicStoreOwnerSession.requireOwnerSession();
  if (!owner) {
    return;
  }

  renderOwnerSessionSlot();
  loadDashboard();
});
