const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const usersRouter = require('./routes/users');

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
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: 'Route not found'
    },
    message: 'Route not found'
  });
});

app.use((error, req, res, next) => {
  console.error('[server] Unhandled error', error);
  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error'
    },
    message: 'Internal server error'
  });
});

app.listen(PORT, () => {
  console.log(`Siribhoomi Farm and Organic Store server running at http://localhost:${PORT}`);
});
