const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const chalk = require("chalk");
const api = require("./api");
const getBatches = require("./getBatches");
const { sleep } = require("./utils");
const { addUser } = require("./db");

const BASE_DIR = path.resolve(os.homedir(), ".busydb");
const CACHE_DIR = path.resolve(BASE_DIR, "cache");

async function getBatch(batch) {
  const requests = batch.map(block => ({
    method: "get_ops_in_block",
    params: [block]
  }));

  return await api
    .sendBatchAsync(requests, null)
    .reduce((a, b) => [...a, ...b], []);
}

async function processBatch(resp) {
  const txs = JSON.parse(resp);
  for (let tx of txs) {
    const [type, payload] = tx.op;

    switch (type) {
      case "pow":
        await addUser(payload.worker_account);
        break;
      case "pow2":
        await addUser(payload.work.value.input.worker_account);
        break;
      case "new_account_name":
      case "account_create_with_delegation":
        await addUser(payload.new_account_name);
    }
  }
}

async function syncOffline(head) {
  for (let i = 0; i <= head; i++) {
    const resp = await fs.readFile(
      path.resolve(CACHE_DIR, `${i}.batch`),
      "utf8"
    );
    await processBatch(resp);
  }

  console.log(chalk.green("Offline sync completed"));
}

async function syncOnline(head) {
  const batches = getBatches(1, 22910707);

  const startBatch = head ? head + 1 : 0;

  for (let i = startBatch; i < batches.length; i++) {
    try {
      if (i % 10 === 0) {
        console.log(chalk.blue(`Processing batch: ${i}`));
      }
      const resp = await getBatch(batches[i]);
      await processBatch(resp);

      await fs.writeFile(
        path.resolve(CACHE_DIR, `${i}.batch`),
        JSON.stringify(resp)
      );
      await fs.writeFile(path.resolve(BASE_DIR, "head"), i);
    } catch (err) {
      console.log(err);
      await sleep(2000);
      i--;
    }
  }
}

module.exports = async function sync(offline) {
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureFile(path.resolve(CACHE_DIR, "head"));
  const head = parseInt(
    await fs.readFile(path.resolve(BASE_DIR, "head"), "utf8")
  );

  console.log(chalk.yellow(`Current head is: ${chalk.bold(head)}`));

  if (offline) {
    syncOffline(head);
  } else {
    syncOnline(head);
  }
};
