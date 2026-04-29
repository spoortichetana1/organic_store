const API_BASE_URL =
  window.location.protocol === 'file:'
    ? 'http://localhost:3000'
    : window.location.origin;

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      },
      ...options
    });
  } catch (error) {
    throw new Error(`Network error: unable to reach ${API_BASE_URL}. Start the backend and try again.`);
  }

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    data = text ? { message: text } : null;
  }

  if (!response.ok) {
    const errorMessage =
      (data && (data.message || data.error?.message)) ||
      `${response.status} ${response.statusText || 'Request failed'}`;
    throw new Error(errorMessage);
  }

  return data;
}

function toQueryString(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      search.set(key, String(value).trim());
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

window.OrganicStoreAPI = {
  request,
  registerUser(payload) {
    return request('/users/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  loginUser(payload) {
    return request('/users/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
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
  getOrders(params = {}) {
    return request(`/orders${toQueryString(params)}`);
  },
  getAdminOrders(params = {}) {
    return request(`/orders/admin${toQueryString(params)}`);
  },
  updateOrderStatus(orderId, payload) {
    return request(`/orders/admin/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  updateOrderPaymentStatus(orderId, payload) {
    return request(`/orders/admin/${encodeURIComponent(orderId)}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};
