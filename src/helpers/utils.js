const DiffMatchPatch = require("diff-match-patch");
const api = require("./api");

const dmp = new DiffMatchPatch();
const HF_BLOCKS = [2889020];

function getNewBody(oldBody, body) {
  let isPatch = false;
  let patch = null;

  try {
    patch = dmp.patch_fromText(body);
    isPatch = patch.length !== 0;
  } catch (err) {
    isPatch = false;
  }

  return isPatch ? dmp.patch_apply(patch, oldBody)[0] : body;
}

async function getBatch(batch) {
  const requests = batch.map(block => ({
    method: "get_ops_in_block",
    params: [block]
  }));

  return await api
    .sendBatchAsync(requests, null)
    .reduce((a, b) => [...a, ...b], []);
}

function getBatches(startBlock, blockCount, batchSize = 50) {
  const batches = [];

  let batch = [];
  for (let i = 0; i < blockCount; i++) {
    batch.push(startBlock + i);

    if (batch.length === batchSize || i === blockCount - 1) {
      batches.push(batch.filter(block => !HF_BLOCKS.includes(block)));
      batch = [];
    }
  }

  return batches;
}

module.exports = {
  getNewBody,
  getBatch,
  getBatches
};
