const express = require("express");
const chalk = require("chalk");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const app = express();

const BASE_DIR = path.resolve(os.homedir(), "busydb");
const CACHE_DIR = path.resolve(BASE_DIR, "cache");

app.all("/", async (req, res) => {
  await fs.ensureDir(CACHE_DIR);
  await fs.ensureFile(path.resolve(BASE_DIR, "head"));
  const head = parseInt(
    await fs.readFile(path.resolve(BASE_DIR, "head"), "utf8")
  );
  res.json({ head });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(chalk.yellow(`Listening on port: ${port}`));
});
