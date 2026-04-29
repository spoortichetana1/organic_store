function getCheckoutSummaryContainer() {
  return document.getElementById('checkout-summary');
}

function renderCheckoutSummary() {
  const container = getCheckoutSummaryContainer();
  if (!container) {
    return;
  }

  const cart = OrganicStoreCart.readCart();
  const total = OrganicStoreCart.calculateCartTotal(cart);

  if (cart.length === 0) {
    container.innerHTML = `
      <div class="panel panel-pad empty-state">
        <h3>Your cart is empty</h3>
        <p class="muted">Add products before checkout.</p>
        <div class="page-actions actions-center">
          <a class="button button-primary" href="products.html">Browse Products</a>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="summary-list">
      ${cart
        .map(
          (item) => `
            <div class="summary-row">
              <div>
                <strong>${item.name}</strong>
                <div class="muted">${item.quantity} x ${OrganicStoreCart.formatCurrency(item.price)}</div>
              </div>
              <strong>${OrganicStoreCart.formatCurrency(item.price * item.quantity)}</strong>
            </div>
          `
        )
        .join('')}
      <div class="summary-total summary-row">
        <span>Total</span>
        <span>${OrganicStoreCart.formatCurrency(total)}</span>
      </div>
    </div>
  `;
}

function ensureCartExists() {
  const cart = OrganicStoreCart.readCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
  }
}

async function handleCheckoutSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const errorNode = document.getElementById('checkout-error');

  const cart = OrganicStoreCart.readCart();
  if (cart.length === 0) {
    window.location.href = 'cart.html';
    return;
  }

  const currentUser = window.OrganicStoreSession.requireLogin();
  if (!currentUser) {
    return;
  }

  const payload = {
    userId: String(currentUser.id).trim(),
    username: String(currentUser.username).trim(),
    customerName: form.customerName.value.trim(),
    phone: form.phone.value.trim(),
    address: form.address.value.trim(),
    items: cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    }))
  };

  if (errorNode) {
    errorNode.textContent = '';
    errorNode.hidden = true;
  }

  if (!payload.customerName || !payload.phone || !payload.address) {
    if (errorNode) {
      errorNode.textContent = 'Please fill in all checkout fields.';
      errorNode.hidden = false;
    }
    return;
  }

  if (!payload.userId && !payload.username) {
    if (errorNode) {
      errorNode.textContent = 'Please log in before placing an order.';
      errorNode.hidden = false;
    }
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Placing Order...';

  try {
    const response = await OrganicStoreAPI.createOrder(payload);
    const order = response.data;
    const cartSnapshot = OrganicStoreCart.readCart();

    sessionStorage.setItem(
      OrganicStoreCart.LAST_ORDER_KEY,
      JSON.stringify({
        ...order,
        items: cartSnapshot
      })
    );

    OrganicStoreCart.clearCart();
    window.location.href = 'success.html';
  } catch (error) {
    if (errorNode) {
      errorNode.textContent = error.message;
      errorNode.hidden = false;
    }
    submitButton.disabled = false;
    submitButton.textContent = 'Place Order';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  ensureCartExists();
  renderCheckoutSummary();

  const form = document.getElementById('checkout-form');
  if (form) {
    form.addEventListener('submit', handleCheckoutSubmit);
  }
});
