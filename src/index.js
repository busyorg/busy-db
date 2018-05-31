const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const api = require("./api");
const getBatches = require("./getBatches");

async function getBatch(batch) {
  const requests = batch.map(block => ({
    method: "get_ops_in_block",
    params: [block]
  }));

  return await api
    .sendBatchAsync(requests, null)
    .reduce((a, b) => [...a, ...b], []);
}

async function start() {
  const baseDir = path.resolve(os.homedir(), ".busydb");
  const cacheDir = path.resolve(baseDir, "cache");

  await fs.ensureDir(cacheDir);
  await fs.ensureFile(path.resolve(cacheDir, "head"));
  const head = await fs.readFile(path.resolve(cacheDir, "head"), "utf8");

  const batches = getBatches(1, 22910707);

  const startBatch = head ? parseInt(head) + 1 : 0;

  console.log("Old head: ", head);

  for (let i = startBatch; i < batches.length; i++) {
    try {
      const resp = await getBatch(batches[i]);
      await fs.writeFile(
        path.resolve(cacheDir, `${i}.batch`),
        JSON.stringify(resp)
      );
      await fs.writeFile(path.resolve(cacheDir, "head"), i);
    } catch (err) {
      console.log(err);
    }
  }
}

start();
