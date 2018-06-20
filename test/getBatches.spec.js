const { getBatches } = require("../helpers/utils");

describe("getBatches", () => {
  it("creates block batches", () => {
    expect(getBatches(20, 20, 3)).toEqual([
      [20, 21, 22],
      [23, 24, 25],
      [26, 27, 28],
      [29, 30, 31],
      [32, 33, 34],
      [35, 36, 37],
      [38, 39]
    ]);
  });

  it("creates block batches with default batch size", () => {
    expect(getBatches(20, 60)).toEqual([
      [
        20,
        21,
        22,
        23,
        24,
        25,
        26,
        27,
        28,
        29,
        30,
        31,
        32,
        33,
        34,
        35,
        36,
        37,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        46,
        47,
        48,
        49,
        50,
        51,
        52,
        53,
        54,
        55,
        56,
        57,
        58,
        59,
        60,
        61,
        62,
        63,
        64,
        65,
        66,
        67,
        68,
        69
      ],
      [70, 71, 72, 73, 74, 75, 76, 77, 78, 79]
    ]);
  });

  it("ignores HF blocks", () => {
    expect(getBatches(2889018, 5, 2)).toEqual([
      [2889018, 2889019],
      [2889021],
      [2889022]
    ]);
  });
});
