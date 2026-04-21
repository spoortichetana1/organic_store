const fs = require('fs/promises');
const path = require('path');

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath, defaultValue) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (defaultValue !== undefined) {
        await writeJson(filePath, defaultValue);
        return defaultValue;
      }
      return null;
    }

    throw error;
  }
}

async function writeJson(filePath, data) {
  await ensureParentDirectory(filePath);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  readJson,
  writeJson
};
