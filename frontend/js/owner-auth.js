function showOwnerMessage(node, message, kind = 'info') {
  if (!node) {
    return;
  }

  node.hidden = false;
  node.textContent = message;
  node.dataset.kind = kind;
}

function bindOwnerLoginForm() {
  const form = document.getElementById('owner-login-form');
  const messageNode = document.getElementById('owner-auth-message');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username || !password) {
      showOwnerMessage(messageNode, 'Enter the owner username and password.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';
    messageNode.hidden = true;

    try {
      const response = await OrganicStoreAPI.loginUser({ username, password });
      const user = response.data || {};
      const role = String(user.role || '').trim().toLowerCase();

      if (role !== 'owner' && role !== 'admin') {
        throw new Error('This account does not have owner access');
      }

      window.OrganicStoreOwnerSession.setOwnerSession(user);
      showOwnerMessage(messageNode, 'Owner access granted. Redirecting...', 'success');
      window.setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 700);
    } catch (error) {
      showOwnerMessage(messageNode, error.message, 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Owner Log In';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const existingOwner = window.OrganicStoreOwnerSession.getOwnerSession();
  if (existingOwner && ['owner', 'admin'].includes(String(existingOwner.role || '').trim().toLowerCase())) {
    window.location.href = 'admin-dashboard.html';
    return;
  }

  bindOwnerLoginForm();
});
