const FORKS = [
  0,
  1461605400,
  1461693600,
  1461762000,
  1462028400,
  1464714000,
  1467295200,
  1467590400,
  1467594000,
  1468454400,
  1468584000,
  1468767600,
  1469545200,
  1471269600,
  1474383600,
  1478620800,
  1481040000,
  1490886000,
  1490886000,
  1497970800
];

module.exports = function hasHardfork(timestamp, forkNum) {
  if (forkNum == 0) return true;

  return FORKS.findIndex(fork => fork > timestamp) - 1 >= forkNum;
};
