const bigInt = require("big-integer");
const constants = require("./constants");

function calcPercentRewardPerBlock(percent, multiplier, shift, supply) {
  const half = bigInt(1).shiftLeft(shift - 1);

  let reward = bigInt(supply);
  reward = reward.multiply(multiplier.multiply(percent));
  reward = reward.add(half);
  reward = reward.shiftRight(shift);

  return reward.toJSNumber();
}

function getContentReward(dp) {
  const percent = calcPercentRewardPerBlock(
    constants.CONTENT_APR_PERCENT,
    constants.APR_PERCENT_MULTIPLY_PER_BLOCK,
    constants.APR_PERCENT_SHIFT_PER_BLOCK,
    dp.virtualSupply
  );
  return Math.max(percent, constants.MIN_CONTENT_REWARD);
}

function getCurationReward(dp) {
  const percent = calcPercentRewardPerBlock(
    constants.CURATE_APR_PERCENT,
    constants.APR_PERCENT_MULTIPLY_PER_BLOCK,
    constants.APR_PERCENT_SHIFT_PER_BLOCK,
    dp.virtualSupply
  );
  return Math.max(percent, constants.MIN_CURATE_REWARD);
}

function getProducerReward(dp) {
  const percent = calcPercentRewardPerBlock(
    constants.PRODUCER_APR_PERCENT,
    constants.APR_PERCENT_MULTIPLY_PER_BLOCK,
    constants.APR_PERCENT_SHIFT_PER_BLOCK,
    dp.virtualSupply
  );
  return Math.max(percent, constants.MIN_PRODUCER_REWARD);
}

function processFunds(dp) {
  // TODO: Handle HF 16
  const newDp = { ...dp };

  let contentReward = getContentReward(newDp);
  const curateReward = getCurationReward(newDp);
  const witnessPay = getProducerReward(newDp);
  const vestingReward = contentReward + curateReward + witnessPay;

  contentReward = contentReward + curateReward;

  if (newDp.headBlockNumber < constants.START_VESTING_BLOCK) {
    vestingReward.amount = 0;
  } else {
    vestingReward.amount *= 9;
  }

  newDp.virtualSupply += contentReward + witnessPay + vestingReward;

  return newDp;
}

module.exports = {
  processFunds
};
