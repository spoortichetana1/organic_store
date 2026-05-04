const express = require('express');
const path = require('path');
const { readJson } = require('../utils/fileStore');
const { sendMethodNotAllowed, sendApiError } = require('../utils/http');

const router = express.Router();
const productsFile = path.join(__dirname, '..', '..', 'data', 'products.json');

router.get('/', async (req, res) => {
  try {
    const products = await readJson(productsFile, []);
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('[products] GET / failed', error);
    sendApiError(res, 500, 'PRODUCTS_LOAD_FAILED', 'Failed to load products');
  }
});

router.all('/', (req, res) => sendMethodNotAllowed(res, ['GET'], 'Method not allowed', '/products'));

module.exports = router;
