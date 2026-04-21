const state = {
  products: [],
  activeCategory: 'All'
};

function getProductsContainer() {
  return document.getElementById('products-grid');
}

function getFiltersContainer() {
  return document.getElementById('category-filters');
}

function getCartCountNode() {
  return document.querySelector('[data-products-cart-count]');
}

function formatPrice(price, unit) {
  return `${OrganicStoreCart.formatCurrency(price)} / ${unit}`;
}

function syncProductsCartCount() {
  const node = getCartCountNode();
  if (!node) {
    return;
  }

  node.textContent = String(OrganicStoreCart.calculateItemCount());
}

function renderFilters(products) {
  const container = getFiltersContainer();
  if (!container) {
    return;
  }

  const categories = ['All', ...new Set(products.map((product) => product.category))];
  container.innerHTML = categories
    .map(
      (category) => `
        <button type="button" class="chip ${category === state.activeCategory ? 'active' : ''}" data-category="${category}">
          ${category}
        </button>
      `
    )
    .join('');
}

function renderProducts() {
  const container = getProductsContainer();
  if (!container) {
    return;
  }

  const filteredProducts =
    state.activeCategory === 'All'
      ? state.products
      : state.products.filter((product) => product.category === state.activeCategory);

  if (filteredProducts.length === 0) {
    container.innerHTML = `
      <div class="panel panel-pad empty-state">
        <h3>No products found</h3>
        <p class="muted">Try a different category.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredProducts
    .map(
      (product) => `
        <article class="panel product-card">
          <div class="product-media">
            <img src="${product.image}" alt="${product.name}">
          </div>
          <div class="product-body">
            <div class="product-title-row">
              <h3>${product.name}</h3>
              <span class="badge">${product.category}</span>
            </div>
            <div class="price">${formatPrice(product.price, product.unit)}</div>
            <p class="muted">${product.description}</p>
            <div class="summary-row">
              <span class="badge">Stock: ${product.stock}</span>
              <span class="muted">Unit: ${product.unit}</span>
            </div>
            <div class="card-actions">
              <button type="button" class="button button-primary" data-action="add-to-cart" data-product-id="${product.id}">
                Add to Cart
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join('');
}

function setActiveCategory(category) {
  state.activeCategory = category;
  renderFilters(state.products);
  renderProducts();
}

async function loadProducts() {
  const container = getProductsContainer();
  if (!container) {
    return;
  }

  container.innerHTML = `
    <div class="panel panel-pad empty-state">
      <h3>Loading products...</h3>
      <p class="muted">Please wait a moment.</p>
    </div>
  `;

  try {
    const response = await OrganicStoreAPI.getProducts();
    state.products = response.data || [];
    renderFilters(state.products);
    renderProducts();
  } catch (error) {
    container.innerHTML = `
      <div class="panel panel-pad empty-state">
        <h3>Unable to load products</h3>
        <p class="muted">${error.message}</p>
      </div>
    `;
  }
}

function bindProductsPage() {
  const filters = getFiltersContainer();
  const productsGrid = getProductsContainer();

  if (filters) {
    filters.addEventListener('click', (event) => {
      const button = event.target.closest('[data-category]');
      if (!button) {
        return;
      }

      setActiveCategory(button.dataset.category);
    });
  }

  if (productsGrid) {
    productsGrid.addEventListener('click', (event) => {
      const button = event.target.closest('[data-action="add-to-cart"]');
      if (!button) {
        return;
      }

      const productId = button.dataset.productId;
      const product = state.products.find((entry) => entry.id === productId);
      if (!product) {
        return;
      }

      OrganicStoreCart.addToCart(product, 1);
      button.textContent = 'Added';
      syncProductsCartCount();
      setTimeout(() => {
        button.textContent = 'Add to Cart';
      }, 900);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  bindProductsPage();
  loadProducts();
  syncProductsCartCount();

  window.addEventListener('organic-store-cart-updated', syncProductsCartCount);
  window.addEventListener('storage', syncProductsCartCount);
});
