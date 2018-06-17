const HF_BLOCKS = [2889020];
const MAX_BATCH = process.env.MAX_BATCH || 50;

function getBatches(startBlock, blockCount, batchSize = MAX_BATCH) {
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

module.exports = getBatches;
