const MIN_REGISTER_PASSWORD_LENGTH = 8;
const MAX_REGISTER_PASSWORD_LENGTH = 128;

function getQueryValue(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

function showMessage(node, message, kind = 'info') {
  if (!node) {
    return;
  }

  node.hidden = false;
  node.textContent = message;
  node.dataset.kind = kind;
}

function handleAlreadyLoggedIn() {
  const user = window.OrganicStoreSession.getCurrentUser();
  const mainLink = document.querySelector('[data-auth-main-link]');
  if (user && mainLink) {
    mainLink.textContent = `Continue as ${user.username}`;
  }
}

function validateRegistrationInput(username, password, confirmPassword) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');
  const cleanConfirmPassword = String(confirmPassword || '');

  if (!cleanUsername) {
    return 'Please enter a username.';
  }

  if (!cleanPassword) {
    return 'Please enter a password.';
  }

  if (!cleanConfirmPassword) {
    return 'Please confirm your password.';
  }

  if (cleanPassword !== cleanConfirmPassword) {
    return 'Passwords do not match.';
  }

  if (cleanPassword.length < MIN_REGISTER_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_REGISTER_PASSWORD_LENGTH} characters.`;
  }

  if (cleanPassword.length > MAX_REGISTER_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_REGISTER_PASSWORD_LENGTH} characters.`;
  }

  return null;
}

function bindLoginForm() {
  const form = document.getElementById('login-form');
  const messageNode = document.getElementById('auth-message');
  if (!form) {
    return;
  }

  const usernameFromRegister = getQueryValue('username');
  const registered = getQueryValue('registered');
  if (usernameFromRegister) {
    form.username.value = usernameFromRegister;
  }
  if (registered === '1') {
    showMessage(messageNode, 'Account created. Please log in.', 'success');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value;

    if (!username || !password) {
      showMessage(messageNode, 'Please enter your username and password.', 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Logging in...';
    messageNode.hidden = true;

    try {
      const response = await OrganicStoreAPI.loginUser({ username, password });
      window.OrganicStoreSession.setCurrentUser(response.data);
      showMessage(messageNode, 'Login successful. Redirecting...', 'success');
      window.setTimeout(() => {
        window.location.href = window.OrganicStoreSession.getLoginDestination();
      }, 700);
    } catch (error) {
      showMessage(messageNode, error.message, 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Log In';
    }
  });
}

function bindRegisterForm() {
  const form = document.getElementById('register-form');
  const messageNode = document.getElementById('auth-message');
  if (!form) {
    return;
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = form.username.value.trim();
    const password = form.password.value;
    const confirmPassword = form.confirmPassword.value;

    const validationError = validateRegistrationInput(username, password, confirmPassword);
    if (validationError) {
      showMessage(messageNode, validationError, 'error');
      return;
    }

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Creating...';
    messageNode.hidden = true;

    try {
      await OrganicStoreAPI.registerUser({ username, password });
      showMessage(messageNode, 'Registration successful. Redirecting to login...', 'success');
      window.setTimeout(() => {
        window.location.href = `login.html?registered=1&username=${encodeURIComponent(username)}`;
      }, 1500);
    } catch (error) {
      showMessage(messageNode, error.message, 'error');
      submitButton.disabled = false;
      submitButton.textContent = 'Create Account';
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  handleAlreadyLoggedIn();
  bindLoginForm();
  bindRegisterForm();
});
