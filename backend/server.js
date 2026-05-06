const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const customersRouter = require('./routes/customers');
const usersRouter = require('./routes/users');
const { sendApiError } = require('./utils/http');

const backendEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(backendEnvPath)) {
  const envFile = fs.readFileSync(backendEnvPath, 'utf8');
  envFile.split(/\r?\n/).forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf('=');
    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'https://spoortichetana1.github.io'
];
const allowedOrigins = [
  ...DEFAULT_ALLOWED_ORIGINS,
  ...(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
];
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  optionsSuccessStatus: 204
};
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

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
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

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok'
  });
});

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

app.listen(PORT, HOST, () => {
  const displayHost = HOST === '0.0.0.0' ? 'localhost' : HOST;
  console.log(
    `Siribhoomi Farm and Organic Store server running at http://${displayHost}:${PORT}`
  );
});
