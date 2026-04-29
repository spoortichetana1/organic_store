const OWNER_SESSION_KEY = 'organicStoreOwnerSession';

function getOwnerSession() {
  try {
    const raw = localStorage.getItem(OWNER_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function setOwnerSession(user) {
  localStorage.setItem(OWNER_SESSION_KEY, JSON.stringify(user));
}

function clearOwnerSession() {
  localStorage.removeItem(OWNER_SESSION_KEY);
}

function isPrivilegedOwner(user) {
  return !!user && ['owner', 'admin'].includes(String(user.role || '').trim().toLowerCase());
}

function requireOwnerSession() {
  const user = getOwnerSession();
  if (!isPrivilegedOwner(user)) {
    clearOwnerSession();
    window.location.href = 'owner-login.html';
    return null;
  }

  return user;
}

window.OrganicStoreOwnerSession = {
  getOwnerSession,
  setOwnerSession,
  clearOwnerSession,
  requireOwnerSession,
  isPrivilegedOwner
};
