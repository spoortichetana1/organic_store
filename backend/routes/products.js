const express = require('express');
const path = require('path');
const { readJson } = require('../utils/fileStore');

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
    res.status(500).json({
      success: false,
      message: 'Failed to load products'
    });
  }
});

module.exports = router;
