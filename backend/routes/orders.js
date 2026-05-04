const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { findUserById, findUserByUsername, isPrivilegedRole } = require('../utils/userStore');
const { sendMethodNotAllowed, sendApiError } = require('../utils/http');

const router = express.Router();
const dataDir = path.join(__dirname, '..', '..', 'data');
const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');
const ALLOWED_ORDER_STATUSES = new Set(['placed', 'confirmed', 'delivered']);
const ALLOWED_PAYMENT_STATUSES = new Set(['pending', 'paid']);

function createOrderId(orderCount) {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(orderCount).padStart(3, '0');
  return `ord-${datePart}-${sequence}`;
}

function toPositiveInteger(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function sortOrders(orders, sort) {
  const direction = String(sort || 'recent').trim().toLowerCase();
  const sortedOrders = [...orders].sort((left, right) => {
    const leftTime = new Date(left.timestamp || 0).getTime();
    const rightTime = new Date(right.timestamp || 0).getTime();
    return leftTime - rightTime;
  });

  if (direction === 'oldest') {
    return sortedOrders;
  }

  return sortedOrders.reverse();
}

function normalizeOrderStatus(status) {
  const cleanStatus = String(status || '').trim().toLowerCase();
  if (ALLOWED_ORDER_STATUSES.has(cleanStatus)) {
    return cleanStatus;
  }

  return null;
}

function normalizePaymentStatus(status) {
  const cleanStatus = String(status || 'pending').trim().toLowerCase();
  if (ALLOWED_PAYMENT_STATUSES.has(cleanStatus)) {
    return cleanStatus;
  }

  return 'pending';
}

function validatePaymentStatus(status) {
  const cleanStatus = String(status || '').trim().toLowerCase();
  return ALLOWED_PAYMENT_STATUSES.has(cleanStatus) ? cleanStatus : null;
}

function normalizeOrder(order) {
  return {
    ...order,
    paymentStatus: normalizePaymentStatus(order && order.paymentStatus)
  };
}

async function requirePrivilegedUser(req, res) {
  const { userId, username } = req.body || req.query || {};
  if (!userId && !username) {
    console.warn('[orders] privileged access missing user identity');
    res.status(400).json({
      success: false,
      message: 'userId or username is required'
    });
    return null;
  }

  const user = userId ? await findUserById(userId) : await findUserByUsername(username);
  if (!user) {
    console.warn('[orders] privileged access user not found', {
      userId: userId || null,
      username: username || null
    });
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return null;
  }

  if (!isPrivilegedRole(user.role)) {
    console.warn('[orders] privileged access denied', {
      userId: user.id,
      username: user.username,
      role: user.role
    });
    res.status(403).json({
      success: false,
      message: 'Owner access required'
    });
    return null;
  }

  return user;
}

router.get('/', async (req, res) => {
  try {
    const { userId, username } = req.query || {};
    console.log('[orders] GET / begin', {
      userId: userId || null,
      username: username || null
    });
    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    console.log(`[orders] GET / loaded ${orders.length} orders`);

    if (userId || username) {
      const user = userId ? await findUserById(userId) : await findUserByUsername(username);
      if (!user) {
        console.warn('[orders] GET / user not found', {
          userId: userId || null,
          username: username || null
        });
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const filteredOrders = orders.filter((order) => order.userId === user.id);
      return res.json({
        success: true,
        data: filteredOrders
      });
    }

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('[orders] GET / failed', error);
    sendApiError(res, 500, 'ORDERS_LOAD_FAILED', 'Failed to load orders');
  }
});

router.get('/admin', async (req, res) => {
  try {
    console.log('[orders] GET /admin begin', {
      sort: req.query && req.query.sort ? req.query.sort : 'recent'
    });
    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    console.log(`[orders] GET /admin loaded ${orders.length} orders`);
    const sortedOrders = sortOrders(orders, req.query && req.query.sort);

    res.json({
      success: true,
      message: 'Admin orders loaded successfully',
      data: sortedOrders
    });
  } catch (error) {
    console.error('[orders] GET /admin failed', error);
    sendApiError(res, 500, 'ADMIN_ORDERS_LOAD_FAILED', 'Failed to load admin orders');
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, username, customerName, phone, address, items } = req.body || {};
    console.log('[orders] POST / begin', {
      userId: userId || null,
      username: username || null,
      customerName: String(customerName || '').trim(),
      items: Array.isArray(items) ? items.length : 0
    });

    if (!userId && !username) {
      console.warn('[orders] POST / validation failed: missing user identity');
      return res.status(400).json({
        success: false,
        message: 'userId or username is required'
      });
    }

    const user = userId ? await findUserById(userId) : await findUserByUsername(username);
    if (!user) {
      console.warn('[orders] POST / user not found', {
        userId: userId || null,
        username: username || null
      });
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!customerName || !phone || !address) {
      console.warn('[orders] POST / validation failed: missing customer details');
      return res.status(400).json({
        success: false,
        message: 'customerName, phone, and address are required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.warn('[orders] POST / validation failed: missing items');
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    const products = await readJson(productsFile, []);
    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    console.log('[orders] POST / loaded products/orders', {
      products: products.length,
      orders: orders.length
    });
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const quantity = toPositiveInteger(item.quantity);
      if (!quantity || !item.productId) {
        console.warn('[orders] POST / validation failed: invalid item', item);
        return res.status(400).json({
          success: false,
          message: 'Each order item must include a valid productId and quantity'
        });
      }

      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        console.warn('[orders] POST / validation failed: product not found', item.productId);
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (quantity > product.stock) {
        console.warn('[orders] POST / validation failed: insufficient stock', {
          productId: product.id,
          requested: quantity,
          available: product.stock
        });
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}`
        });
      }

      const lineTotal = product.price * quantity;
      total += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        unit: product.unit,
        quantity,
        lineTotal
      });

      product.stock -= quantity;
    }

    const order = {
      id: createOrderId(orders.length + 1),
      userId: user.id,
      username: user.username,
      customerName: String(customerName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      items: orderItems,
      total,
      timestamp: new Date().toISOString(),
      status: 'placed',
      paymentStatus: 'pending'
    };

    orders.push(order);

    const wroteProducts = await writeJson(productsFile, products);
    const wroteOrders = await writeJson(ordersFile, orders);
    if (!wroteProducts || !wroteOrders) {
      console.error('[orders] POST / storage write failed', {
        wroteProducts,
        wroteOrders
      });
      throw new Error('failed to write order storage');
    }
    console.log('[orders] POST / success', {
      orderId: order.id,
      total: order.total,
      userId: order.userId
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    console.error('[orders] POST / unexpected exception', error);
    sendApiError(res, 500, 'ORDER_CREATE_FAILED', 'Failed to place order');
  }
});

router.patch('/admin/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body || {};
    const nextStatus = normalizeOrderStatus(status);
    console.log('[orders] PATCH /admin/:orderId/status begin', {
      orderId,
      status: nextStatus || status
    });

    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    if (!String(orderId || '').trim()) {
      console.warn('[orders] PATCH status validation failed: missing orderId');
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    if (!nextStatus) {
      console.warn('[orders] PATCH status validation failed: invalid status', status);
      return res.status(400).json({
        success: false,
        message: 'status must be placed, confirmed, or delivered'
      });
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const order = orders.find((entry) => String(entry.id) === String(orderId).trim());

    if (!order) {
      console.warn('[orders] PATCH status order not found', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();

    const wroteOrders = await writeJson(ordersFile, orders);
    if (!wroteOrders) {
      console.error('[orders] PATCH status storage write failed', {
        orderId: order.id
      });
      throw new Error('failed to update order status storage');
    }
    console.log('[orders] PATCH status success', {
      orderId: order.id,
      status: order.status
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('[orders] PATCH /admin/:orderId/status unexpected exception', error);
    sendApiError(res, 500, 'ORDER_STATUS_UPDATE_FAILED', 'Failed to update order status');
  }
});

router.patch('/admin/:orderId/payment-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body || {};
    const nextPaymentStatus = validatePaymentStatus(paymentStatus);
    console.log('[orders] PATCH /admin/:orderId/payment-status begin', {
      orderId,
      paymentStatus: nextPaymentStatus || paymentStatus
    });

    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    if (!String(orderId || '').trim()) {
      console.warn('[orders] PATCH payment validation failed: missing orderId');
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    if (!nextPaymentStatus) {
      console.warn('[orders] PATCH payment validation failed: invalid paymentStatus', paymentStatus);
      return res.status(400).json({
        success: false,
        message: 'paymentStatus must be pending or paid'
      });
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const order = orders.find((entry) => String(entry.id) === String(orderId).trim());

    if (!order) {
      console.warn('[orders] PATCH payment order not found', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = nextPaymentStatus;
    order.updatedAt = new Date().toISOString();

    const wroteOrders = await writeJson(ordersFile, orders);
    if (!wroteOrders) {
      console.error('[orders] PATCH payment storage write failed', {
        orderId: order.id
      });
      throw new Error('failed to update order payment storage');
    }
    console.log('[orders] PATCH payment success', {
      orderId: order.id,
      paymentStatus: order.paymentStatus
    });

    res.json({
      success: true,
      message: 'Order payment status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('[orders] PATCH /admin/:orderId/payment-status unexpected exception', error);
    sendApiError(
      res,
      500,
      'ORDER_PAYMENT_STATUS_UPDATE_FAILED',
      'Failed to update order payment status'
    );
  }
});

router.all('/admin/:orderId/status', (req, res) =>
  sendMethodNotAllowed(res, ['PATCH'], 'Method not allowed', '/orders/admin/:orderId/status')
);
router.all('/admin/:orderId/payment-status', (req, res) =>
  sendMethodNotAllowed(res, ['PATCH'], 'Method not allowed', '/orders/admin/:orderId/payment-status')
);
router.all('/admin', (req, res) => sendMethodNotAllowed(res, ['GET'], 'Method not allowed', '/orders/admin'));
router.all('/', (req, res) => sendMethodNotAllowed(res, ['GET', 'POST'], 'Method not allowed', '/orders'));

module.exports = router;
