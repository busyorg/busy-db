const { processFunds } = require("../../src/dynamic");

describe("processFunds", () => {
  it("should calculate virtual supply", () => {
    const dp = {
      headBlockNumber: 1,
      virtualSupply: 250000000000
    };

    const actual = processFunds(dp);
    const expected = {
      headBlockNumber: 1,
      virtualSupply: 250000006000
    };

    expect(actual).toEqual(expected);
  });
});
