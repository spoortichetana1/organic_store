const fs = require('fs/promises');
const path = require('path');

function logFileOperation(action, filePath, details) {
  const suffix = details ? ` ${JSON.stringify(details)}` : '';
  console.log(`[fileStore] ${action} ${filePath}${suffix}`);
}

async function ensureParentDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readJson(filePath, defaultValue) {
  try {
    logFileOperation('read', filePath);
    const raw = await fs.readFile(filePath, 'utf8');
    console.log(`[fileStore] read success ${filePath}`);
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      if (defaultValue !== undefined) {
        logFileOperation('missing, seeding default', filePath);
        await writeJson(filePath, defaultValue);
        return defaultValue;
      }
      console.warn(`[fileStore] missing ${filePath}`);
      return null;
    }

    console.error(`[fileStore] read failed ${filePath}`, error);
    return defaultValue !== undefined ? defaultValue : null;
  }
}

async function writeJson(filePath, data) {
  const tempFilePath = `${filePath}.tmp`;
  try {
    await ensureParentDirectory(filePath);
    logFileOperation('write', filePath, {
      entries: Array.isArray(data) ? data.length : Object.keys(data || {}).length
    });
    await fs.writeFile(tempFilePath, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tempFilePath, filePath);
    console.log(`[fileStore] write success ${filePath}`);
    return true;
  } catch (error) {
    console.error(`[fileStore] write failed ${filePath}`, error);
    try {
      await fs.rm(tempFilePath, { force: true });
    } catch (cleanupError) {
      console.warn(`[fileStore] temp cleanup failed ${tempFilePath}`, cleanupError);
    }
    return false;
  }
}

module.exports = {
  readJson,
  writeJson
};
