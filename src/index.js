#!/usr/bin/env node

const sync = require("./sync");

require("yargs").command(
  "sync",
  "start syncing process",
  yargs => {
    yargs.option("offline", {
      alias: "o",
      default: false
    });
  },
  argv => {
    sync(argv.offline);
  }
).argv;
