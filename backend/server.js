const express = require('express');
const cors = require('cors');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const usersRouter = require('./routes/users');
const { sendApiError } = require('./utils/http');

const app = express();
const PORT = process.env.PORT || 3000;
const rootDir = path.join(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');
const assetsDir = path.join(rootDir, 'assets');

app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[request] ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    console.log(`[response] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
  });

  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(frontendDir));
app.use('/assets', express.static(assetsDir));

app.post('/api/customers/register', customersRouter.handleRegister);
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/auth', usersRouter);
app.use('/products', productsRouter);
app.use('/orders', ordersRouter);
app.use('/users', usersRouter);

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.use((req, res) => {
  console.warn(`[route] not found ${req.method} ${req.originalUrl}`);
  sendApiError(res, 404, 'ROUTE_NOT_FOUND', 'Route not found');
});

app.use((error, req, res, next) => {
  console.error('[server] Unhandled error', error);
  if (res.headersSent) {
    return next(error);
  }

  sendApiError(res, 500, 'INTERNAL_SERVER_ERROR', 'Internal server error');
});

app.listen(PORT, () => {
  console.log(`Siribhoomi Farm and Organic Store server running at http://localhost:${PORT}`);
});
