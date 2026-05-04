// The frontend may be opened from a static dev server (for example 127.0.0.1:5500),
// but the MVP backend always runs on port 3000.
const API_BASE_URL = 'http://127.0.0.1:3000';

const API_ROUTES = {
  auth: {
    login: '/auth/login'
  },
  customers: {
    register: '/api/customers/register'
  },
  products: '/api/products',
  orders: '/orders',
  adminOrders: '/orders/admin'
};

async function request(path, options = {}) {
  let response;
  const method = String(options.method || 'GET').trim().toUpperCase();
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        Accept: 'application/json',
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
    const allowedMethods =
      (data && data.error && data.error.details && data.error.details.allowedMethods) ||
      response.headers.get('allow') ||
      '';
    const htmlBody = typeof data?.message === 'string' && /<html|<!doctype html|cannot get/i.test(data.message);
    const errorMessage =
      response.status === 405
        ? `Method ${method} is not allowed for ${path}. ${allowedMethods ? `Allowed methods: ${allowedMethods}.` : ''}`.trim()
        : htmlBody
          ? `The API route ${path} is not available on the backend. Check the server mount and endpoint path.`
          : (data && (data.message || data.error?.message)) ||
          `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ''}`;
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
  routes: API_ROUTES,
  request,
  registerUser(payload) {
    return request(API_ROUTES.customers.register, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  loginUser(payload) {
    return request(API_ROUTES.auth.login, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getProducts() {
    return request(API_ROUTES.products).catch((error) => ({
      success: true,
      data: Array.isArray(window.OrganicStoreCatalog) ? window.OrganicStoreCatalog : [],
      fallback: true,
      warning: error.message || 'Using local catalog fallback.'
    }));
  },
  createOrder(payload) {
    return request(API_ROUTES.orders, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getOrders(params = {}) {
    return request(`${API_ROUTES.orders}${toQueryString(params)}`);
  },
  getAdminOrders(params = {}) {
    return request(`${API_ROUTES.adminOrders}${toQueryString(params)}`);
  },
  updateOrderStatus(orderId, payload) {
    return request(`${API_ROUTES.adminOrders}/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  },
  updateOrderPaymentStatus(orderId, payload) {
    return request(`${API_ROUTES.adminOrders}/${encodeURIComponent(orderId)}/payment-status`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
  }
};
