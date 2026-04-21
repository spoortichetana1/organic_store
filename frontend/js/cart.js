const CART_STORAGE_KEY = 'organicStoreCart';
const LAST_ORDER_KEY = 'organicStoreLastOrder';

function readCart() {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  syncCartCounters();
  window.dispatchEvent(new CustomEvent('organic-store-cart-updated', {
    detail: {
      count: calculateItemCount(cart)
    }
  }));
}

function normalizeQuantity(value) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return 1;
  }
  return quantity;
}

function addToCart(product, quantity = 1) {
  const cart = readCart();
  const existing = cart.find((item) => item.productId === product.id);
  const addQuantity = normalizeQuantity(quantity);

  if (existing) {
    existing.quantity += addQuantity;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      unit: product.unit,
      quantity: addQuantity,
      image: product.image,
      category: product.category
    });
  }

  writeCart(cart);
}

function updateCartItem(productId, quantity) {
  const cart = readCart();
  const target = cart.find((item) => item.productId === productId);
  if (!target) {
    return;
  }

  const nextQuantity = normalizeQuantity(quantity);
  target.quantity = nextQuantity;
  writeCart(cart);
}

function removeCartItem(productId) {
  const nextCart = readCart().filter((item) => item.productId !== productId);
  writeCart(nextCart);
}

function clearCart() {
  writeCart([]);
}

function calculateCartTotal(cart = readCart()) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function calculateItemCount(cart = readCart()) {
  return cart.reduce((sum, item) => sum + item.quantity, 0);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function syncCartCounters() {
  const count = calculateItemCount();
  document.querySelectorAll('[data-cart-count]').forEach((node) => {
    node.textContent = String(count);
  });
}

function renderCartPage() {
  const list = document.getElementById('cart-list');
  const totalNode = document.getElementById('cart-total');
  const emptyNode = document.getElementById('cart-empty');
  const checkoutButton = document.getElementById('checkout-button');

  if (!list || !totalNode) {
    return;
  }

  const cart = readCart();
  syncCartCounters();

  if (cart.length === 0) {
    list.innerHTML = '';
    if (emptyNode) {
      emptyNode.hidden = false;
    }
    if (checkoutButton) {
      checkoutButton.disabled = true;
    }
    totalNode.textContent = formatCurrency(0);
    return;
  }

  if (emptyNode) {
    emptyNode.hidden = true;
  }
  if (checkoutButton) {
    checkoutButton.disabled = false;
  }

  list.innerHTML = cart
    .map(
      (item) => `
        <div class="cart-item" data-product-id="${item.productId}">
          <img src="${item.image}" alt="${item.name}">
          <div>
            <div class="summary-row">
              <h3>${item.name}</h3>
              <span class="badge">${item.unit}</span>
            </div>
            <p class="muted">${formatCurrency(item.price)} each</p>
            <div class="cart-controls">
              <div class="stepper">
                <button type="button" data-action="decrease">-</button>
                <input type="number" min="1" value="${item.quantity}" aria-label="Quantity for ${item.name}" data-action="quantity-input">
                <button type="button" data-action="increase">+</button>
              </div>
              <button type="button" class="button button-secondary" data-action="remove">Remove</button>
            </div>
          </div>
          <div>
            <strong>${formatCurrency(item.price * item.quantity)}</strong>
          </div>
        </div>
      `
    )
    .join('');

  totalNode.textContent = formatCurrency(calculateCartTotal(cart));
}

function bindCartPage() {
  const list = document.getElementById('cart-list');
  if (!list) {
    return;
  }

  list.addEventListener('click', (event) => {
    const item = event.target.closest('.cart-item');
    if (!item) {
      return;
    }

    const productId = item.dataset.productId;
    const action = event.target.dataset.action;
    const cart = readCart();
    const current = cart.find((entry) => entry.productId === productId);
    if (!current) {
      return;
    }

    if (action === 'increase') {
      updateCartItem(productId, current.quantity + 1);
      renderCartPage();
    } else if (action === 'decrease') {
      updateCartItem(productId, Math.max(1, current.quantity - 1));
      renderCartPage();
    } else if (action === 'remove') {
      removeCartItem(productId);
      renderCartPage();
    }
  });

  list.addEventListener('change', (event) => {
    if (event.target.dataset.action !== 'quantity-input') {
      return;
    }

    const item = event.target.closest('.cart-item');
    if (!item) {
      return;
    }

    updateCartItem(item.dataset.productId, event.target.value);
    renderCartPage();
  });
}

window.OrganicStoreCart = {
  readCart,
  writeCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  calculateCartTotal,
  calculateItemCount,
  formatCurrency,
  renderCartPage,
  bindCartPage,
  LAST_ORDER_KEY
};

document.addEventListener('DOMContentLoaded', () => {
  syncCartCounters();
  renderCartPage();
  bindCartPage();
});
