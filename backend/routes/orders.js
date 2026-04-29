const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');
const { findUserById, findUserByUsername, isPrivilegedRole } = require('../utils/userStore');

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
    res.status(400).json({
      success: false,
      message: 'userId or username is required'
    });
    return null;
  }

  const user = userId ? await findUserById(userId) : await findUserByUsername(username);
  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found'
    });
    return null;
  }

  if (!isPrivilegedRole(user.role)) {
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
    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);

    if (userId || username) {
      const user = userId ? await findUserById(userId) : await findUserByUsername(username);
      if (!user) {
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
    res.status(500).json({
      success: false,
      message: 'Failed to load orders'
    });
  }
});

router.get('/admin', async (req, res) => {
  try {
    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const sortedOrders = sortOrders(orders, req.query && req.query.sort);

    res.json({
      success: true,
      message: 'Admin orders loaded successfully',
      data: sortedOrders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load admin orders'
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, username, customerName, phone, address, items } = req.body || {};

    if (!userId && !username) {
      return res.status(400).json({
        success: false,
        message: 'userId or username is required'
      });
    }

    const user = userId ? await findUserById(userId) : await findUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!customerName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'customerName, phone, and address are required'
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order items are required'
      });
    }

    const products = await readJson(productsFile, []);
    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const orderItems = [];
    let total = 0;

    for (const item of items) {
      const quantity = toPositiveInteger(item.quantity);
      if (!quantity || !item.productId) {
        return res.status(400).json({
          success: false,
          message: 'Each order item must include a valid productId and quantity'
        });
      }

      const product = products.find((entry) => entry.id === item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`
        });
      }

      if (quantity > product.stock) {
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

    await writeJson(productsFile, products);
    await writeJson(ordersFile, orders);

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to place order'
    });
  }
});

router.patch('/admin/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body || {};
    const nextStatus = normalizeOrderStatus(status);

    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    if (!String(orderId || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: 'status must be placed, confirmed, or delivered'
      });
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const order = orders.find((entry) => String(entry.id) === String(orderId).trim());

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.status = nextStatus;
    order.updatedAt = new Date().toISOString();

    await writeJson(ordersFile, orders);

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order status'
    });
  }
});

router.patch('/admin/:orderId/payment-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus } = req.body || {};
    const nextPaymentStatus = validatePaymentStatus(paymentStatus);

    const user = await requirePrivilegedUser(req, res);
    if (!user) {
      return;
    }

    if (!String(orderId || '').trim()) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required'
      });
    }

    if (!nextPaymentStatus) {
      return res.status(400).json({
        success: false,
        message: 'paymentStatus must be pending or paid'
      });
    }

    const orders = (await readJson(ordersFile, [])).map(normalizeOrder);
    const order = orders.find((entry) => String(entry.id) === String(orderId).trim());

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.paymentStatus = nextPaymentStatus;
    order.updatedAt = new Date().toISOString();

    await writeJson(ordersFile, orders);

    res.json({
      success: true,
      message: 'Order payment status updated successfully',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update order payment status'
    });
  }
});

module.exports = router;
