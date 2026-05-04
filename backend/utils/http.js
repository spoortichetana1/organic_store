function sendMethodNotAllowed(res, allowedMethods, message = 'Method not allowed', routePath = '') {
  const allowHeader = Array.isArray(allowedMethods) ? allowedMethods.join(', ') : String(allowedMethods || '');
  const responseMessage = allowHeader
    ? `${message}${routePath ? ` for ${routePath}` : ''}. Allowed methods: ${allowHeader}`
    : message;
  if (allowHeader) {
    res.set('Allow', allowHeader);
  }

  return res.status(405).json({
    success: false,
    error: {
      code: 'METHOD_NOT_ALLOWED',
      message: responseMessage,
      details: allowHeader
        ? {
            allowedMethods: allowHeader,
            route: routePath || undefined
          }
        : undefined
    },
    message: responseMessage
  });
}

function sendApiError(res, status, code, message, details) {
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

module.exports = {
  sendMethodNotAllowed,
  sendApiError
};
