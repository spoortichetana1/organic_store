const express = require('express');
const {
  readUsers,
  findUserByUsername,
  createUser,
  validateRegistrationInput,
  validateLoginInput,
  verifyPassword,
  sanitizeUser,
  normalizeRole
} = require('../utils/userStore');
const { sendMethodNotAllowed } = require('../utils/http');

const router = express.Router();

function sendError(res, status, code, message, details) {
  console.warn(`[users] ${code} ${status} ${message}`);
  return res.status(status).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {})
    },
    message
  });
}

router.get('/', async (req, res) => {
  try {
    console.log('[users] GET / begin');
    const users = await readUsers();
    console.log(`[users] GET / loaded ${users.length} users`);
    res.json({
      success: true,
      data: users.map(sanitizeUser)
    });
  } catch (error) {
    console.error('[users] GET / failed', error);
    return sendError(res, 500, 'USERS_LOAD_FAILED', 'Failed to load users');
  }
});

router.get('/:username((?!register$|login$)[^/]+)', async (req, res) => {
  try {
    console.log(`[users] GET /${req.params.username} begin`);
    const user = await findUserByUsername(req.params.username);
    if (!user) {
      return sendError(res, 404, 'USER_NOT_FOUND', 'User not found');
    }

    res.json({
      success: true,
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[users] GET /:username failed', error);
    return sendError(res, 500, 'USER_LOAD_FAILED', 'Failed to load user');
  }
});

async function handleRegister(req, res) {
  try {
    const { username, password } = req.body || {};
    console.log('[users] registration endpoint hit', {
      method: req.method,
      path: req.originalUrl
    });
    console.log('[users] POST /register begin', {
      username: String(username || '').trim(),
      passwordLength: String(password || '').length
    });
    const validationError = validateRegistrationInput({ username, password });
    if (validationError) {
      console.warn('[users] POST /register validation failed', validationError);
      return sendError(res, 400, 'VALIDATION_ERROR', validationError);
    }

    const user = await createUser({ username, password });
    console.log('[users] POST /register success', {
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: sanitizeUser(user)
    });
  } catch (error) {
    const errorMessage = String(error && error.message ? error.message : 'Failed to create user');
    const status =
      errorMessage === 'username already exists' || errorMessage.includes('required')
        ? 400
        : 500;
    console.error('[users] POST /register failed', { status, error: errorMessage });
    return sendError(
      res,
      status,
      status === 400 ? 'REGISTRATION_ERROR' : 'REGISTRATION_FAILED',
      errorMessage
    );
  }
}

async function handleLogin(req, res) {
  try {
    const { username, password } = req.body || {};
    console.log('[users] POST /login begin', {
      username: String(username || '').trim()
    });
    const validationError = validateLoginInput({ username, password });
    if (validationError) {
      console.warn('[users] POST /login validation failed', validationError);
      return sendError(res, 400, 'VALIDATION_ERROR', validationError);
    }

    const user = await findUserByUsername(username);
    if (!user || !verifyPassword(password, user)) {
      console.warn('[users] POST /login invalid credentials', {
        username: String(username || '').trim()
      });
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password');
    }

    const userRole = normalizeRole(user.role);
    const loginMessage =
      userRole === 'owner'
        ? 'Owner login successful'
        : userRole === 'admin'
          ? 'Admin login successful'
          : 'Login successful';

    return res.json({
      success: true,
      message: loginMessage,
      data: sanitizeUser(user)
    });
  } catch (error) {
    console.error('[users] POST /login failed', error);
    return sendError(res, 500, 'LOGIN_FAILED', 'Failed to login');
  }
}

router.post('/register', handleRegister);
router.post('/login', handleLogin);

router.all('/login', (req, res) => sendMethodNotAllowed(res, ['POST'], 'Method not allowed', '/auth/login'));
router.all('/:username', (req, res) => sendMethodNotAllowed(res, ['GET'], 'Method not allowed', '/auth/:username'));
router.all('/', (req, res) => sendMethodNotAllowed(res, ['GET', 'POST'], 'Method not allowed', '/auth'));

module.exports = router;
