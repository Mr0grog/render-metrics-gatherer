const { readFile, writeFile, stat, mkdir } = require("node:fs/promises");
const { dirname, join: joinPath } = require("node:path");

const CACHE_DIRECTORY = "./.cache";

async function getCachedData (key, expirationMs, fetchData) {
  const cachePath = joinPath(CACHE_DIRECTORY, `c-${key}.json`);
  let isCached = false;
  try {
    const fileInfo = await stat(cachePath);
    isCached = Date.now() - fileInfo.mtimeMs < expirationMs;
  } catch (error) {}

  if (isCached) {
    const fileText = await readFile(cachePath, {encoding: "utf-8"});
    return JSON.parse(fileText);
  } else {
    const data = await fetchData();
    await mkdir(dirname(cachePath), { recursive: true });
    await writeFile(cachePath, JSON.stringify(data), { encoding: "utf-8" });
    return data;
  }
}

module.exports = {
  CACHE_DIRECTORY,
  getCachedData
};
