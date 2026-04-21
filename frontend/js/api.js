const API_BASE_URL =
  window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : window.location.origin;

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((data && data.message) || 'Request failed');
  }

  return data;
}

window.OrganicStoreAPI = {
  request,
  getProducts() {
    return request('/products').catch(() => ({
      success: true,
      data: Array.isArray(window.OrganicStoreCatalog) ? window.OrganicStoreCatalog : []
    }));
  },
  createOrder(payload) {
    return request('/orders', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getOrders() {
    return request('/orders');
  }
};
