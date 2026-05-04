const express = require('express');
const {
  createUser,
  validateRegistrationInput,
  sanitizeUser
} = require('../utils/userStore');
const { sendMethodNotAllowed, sendApiError } = require('../utils/http');

const router = express.Router();

function sendError(res, status, code, message, details) {
  return sendApiError(res, status, code, message, details);
}

async function handleRegister(req, res) {
  try {
    const { username, password } = req.body || {};
    console.log('[customers] POST /register begin', {
      method: req.method,
      path: req.originalUrl,
      username: String(username || '').trim(),
      passwordLength: String(password || '').length
    });

    const validationError = validateRegistrationInput({ username, password });
    if (validationError) {
      console.warn('[customers] POST /register validation failed', validationError);
      return sendError(res, 400, 'VALIDATION_ERROR', validationError);
    }

    const customer = await createUser({ username, password, role: 'user' });
    console.log('[customers] POST /register success', {
      userId: customer.id,
      username: customer.username
    });

    return res.status(201).json({
      success: true,
      message: 'Customer registered successfully',
      data: sanitizeUser(customer)
    });
  } catch (error) {
    const errorMessage = String(error && error.message ? error.message : 'Failed to register customer');
    const status = errorMessage === 'username already exists' || errorMessage.includes('required') ? 400 : 500;
    console.error('[customers] POST /register failed', { status, error: errorMessage });
    return sendError(
      res,
      status,
      status === 400 ? 'REGISTRATION_ERROR' : 'REGISTRATION_FAILED',
      errorMessage
    );
  }
}

router.post('/register', handleRegister);
router.all('/register', (req, res) => sendMethodNotAllowed(res, ['POST'], 'Method not allowed', '/api/customers/register'));
router.all('/', (req, res) => sendMethodNotAllowed(res, ['POST'], 'Method not allowed', '/api/customers'));

module.exports = router;
module.exports.handleRegister = handleRegister;
