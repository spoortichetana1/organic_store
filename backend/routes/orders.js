const express = require('express');
const path = require('path');
const { readJson, writeJson } = require('../utils/fileStore');

const router = express.Router();
const dataDir = path.join(__dirname, '..', '..', 'data');
const productsFile = path.join(dataDir, 'products.json');
const ordersFile = path.join(dataDir, 'orders.json');

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

router.get('/', async (req, res) => {
  try {
    const orders = await readJson(ordersFile, []);
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

router.post('/', async (req, res) => {
  try {
    const { customerName, phone, address, items } = req.body || {};

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
    const orders = await readJson(ordersFile, []);
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
      customerName: String(customerName).trim(),
      phone: String(phone).trim(),
      address: String(address).trim(),
      items: orderItems,
      total,
      timestamp: new Date().toISOString(),
      status: 'placed'
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

module.exports = router;
