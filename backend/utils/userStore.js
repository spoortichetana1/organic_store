const crypto = require('crypto');
const path = require('path');
const { readJson, writeJson } = require('./fileStore');

const usersFile = path.join(__dirname, '..', '..', 'data', 'users.json');
const HASH_ITERATIONS = 100000;
const HASH_KEY_LENGTH = 64;
const HASH_DIGEST = 'sha512';
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;
const USER_ROLE = 'user';
const OWNER_ROLE = 'owner';
const ADMIN_ROLE = 'admin';
const ALLOWED_ROLES = new Set([USER_ROLE, OWNER_ROLE, ADMIN_ROLE]);

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function normalizeRole(role) {
  const cleanRole = String(role || USER_ROLE).trim().toLowerCase();
  if (ALLOWED_ROLES.has(cleanRole)) {
    return cleanRole;
  }

  return USER_ROLE;
}

function isPrivilegedRole(role) {
  const cleanRole = normalizeRole(role);
  return cleanRole === OWNER_ROLE || cleanRole === ADMIN_ROLE;
}

function validateRegistrationInput({ username, password }) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanUsername) {
    return 'username is required';
  }

  if (!cleanPassword) {
    return 'password is required';
  }

  if (cleanPassword.length < MIN_PASSWORD_LENGTH) {
    return `password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }

  if (cleanPassword.length > MAX_PASSWORD_LENGTH) {
    return `password must be at most ${MAX_PASSWORD_LENGTH} characters`;
  }

  return null;
}

function validateLoginInput({ username, password }) {
  const cleanUsername = String(username || '').trim();
  const cleanPassword = String(password || '');

  if (!cleanUsername) {
    return 'username is required';
  }

  if (!cleanPassword) {
    return 'password is required';
  }

  return null;
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  const {
    passwordHash,
    passwordSalt,
    passwordIterations,
    passwordAlgorithm,
    ...safeUser
  } = user;
  return safeUser;
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const passwordHash = crypto
    .pbkdf2Sync(String(password), salt, HASH_ITERATIONS, HASH_KEY_LENGTH, HASH_DIGEST)
    .toString('hex');

  return {
    passwordHash,
    passwordSalt: salt,
    passwordIterations: HASH_ITERATIONS,
    passwordAlgorithm: HASH_DIGEST
  };
}

function verifyPassword(password, user) {
  if (!user || !user.passwordHash || !user.passwordSalt) {
    return false;
  }

  const hashed = crypto
    .pbkdf2Sync(
      String(password),
      user.passwordSalt,
      user.passwordIterations || HASH_ITERATIONS,
      HASH_KEY_LENGTH,
      user.passwordAlgorithm || HASH_DIGEST
    )
    .toString('hex');

  if (hashed.length !== String(user.passwordHash).length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(hashed, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

async function readUsers() {
  return readJson(usersFile, []);
}

async function writeUsers(users) {
  return writeJson(usersFile, users);
}

async function findUserByUsername(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    return null;
  }

  const users = await readUsers();
  return users.find((user) => normalizeUsername(user.username) === normalizedUsername) || null;
}

async function findUserById(id) {
  const cleanId = String(id || '').trim();
  if (!cleanId) {
    return null;
  }

  const users = await readUsers();
  return users.find((user) => String(user.id) === cleanId) || null;
}

async function createUser({ username, password, role = USER_ROLE }) {
  const validationError = validateRegistrationInput({ username, password });
  if (validationError) {
    throw new Error(validationError);
  }

  const normalizedUsername = normalizeUsername(username);
  const cleanPassword = String(password || '');

  const users = await readUsers();
  const existingUser = users.find((user) => normalizeUsername(user.username) === normalizedUsername);
  if (existingUser) {
    throw new Error('username already exists');
  }

  const id = `usr-${crypto.randomUUID()}`;
  const passwordData = hashPassword(cleanPassword);

  const user = {
    id,
    username: String(username).trim(),
    role: normalizeRole(role),
    ...passwordData,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await writeUsers(users);

  return user;
}

module.exports = {
  readUsers,
  writeUsers,
  findUserByUsername,
  findUserById,
  createUser,
  validateRegistrationInput,
  validateLoginInput,
  verifyPassword,
  sanitizeUser,
  normalizeRole,
  isPrivilegedRole
};
