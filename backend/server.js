const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const assetsDir = path.join(rootDir, 'assets');

app.use(cors());
app.use(express.json());

app.use(express.static(frontendDir));
app.use('/assets', express.static(assetsDir));

app.use('/products', productsRouter);
app.use('/orders', ordersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

app.listen(PORT, () => {
  console.log(`Organic Store server running at http://localhost:${PORT}`);
});
