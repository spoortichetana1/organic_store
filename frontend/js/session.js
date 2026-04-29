const CURRENT_USER_KEY = 'organicStoreCurrentUser';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new CustomEvent('organic-store-user-changed', { detail: user }));
}

function clearCurrentUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
  window.dispatchEvent(new CustomEvent('organic-store-user-changed', { detail: null }));
}

function getLoginDestination() {
  const params = new URLSearchParams(window.location.search);
  return params.get('returnUrl') || 'index.html';
}

function redirectToLogin() {
  const returnUrl = encodeURIComponent(window.location.pathname.split('/').pop() || 'index.html');
  window.location.href = `login.html?returnUrl=${returnUrl}`;
}

function requireLogin() {
  const user = getCurrentUser();
  if (!user) {
    redirectToLogin();
    return null;
  }
  return user;
}

function hasRole(user, roles) {
  if (!user) {
    return false;
  }

  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  const normalizedRole = String(user.role || 'user').trim().toLowerCase();
  return allowedRoles.map((role) => String(role || '').trim().toLowerCase()).includes(normalizedRole);
}

function requireRole(roles) {
  const user = requireLogin();
  if (!user) {
    return null;
  }

  if (!hasRole(user, roles)) {
    window.location.href = 'index.html';
    return null;
  }

  return user;
}

function getRoleLabel(user) {
  const role = String(user && user.role ? user.role : '').trim().toLowerCase();
  if (role === 'owner') {
    return 'Owner';
  }

  if (role === 'admin') {
    return 'Admin';
  }

  return '';
}

function renderSessionSlot() {
  const slot = document.querySelector('[data-session-slot]');
  if (!slot) {
    return;
  }

  const user = getCurrentUser();
  if (user) {
    const roleLabel = getRoleLabel(user);
    slot.innerHTML = `
      <span class="session-chip">Hi, ${user.username}${roleLabel ? ` <span class="session-role">${roleLabel}</span>` : ''}</span>
      <button type="button" class="button button-secondary session-button" data-action="logout">Logout</button>
    `;
    return;
  }

  slot.innerHTML = `
    <a class="session-link" href="login.html">Log In</a>
    <a class="session-link" href="register.html">Register</a>
  `;
}

document.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="logout"]');
  if (!button) {
    return;
  }

  clearCurrentUser();
  renderSessionSlot();
  window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', renderSessionSlot);

window.OrganicStoreSession = {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  requireLogin,
  requireRole,
  redirectToLogin,
  getLoginDestination,
  renderSessionSlot,
  hasRole
};
