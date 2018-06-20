const hasHardfork = require("../../src/dynamic/hasHardfork");

describe("hasHardfork", () => {
  it("should always have fork 0", () => {
    expect(hasHardfork(0, 0)).toBe(true);
    expect(hasHardfork(252, 0)).toBe(true);
    expect(hasHardfork(1462028500, 0)).toBe(true);
    expect(hasHardfork(1577836800, 0)).toBe(true);
  });

  it("should detect proper fork", () => {
    const timestamp = 1468454450;

    expect(hasHardfork(timestamp, 8)).toBe(true);
    expect(hasHardfork(timestamp, 9)).toBe(true);
    expect(hasHardfork(timestamp, 10)).toBe(false);
  });

  it("should be inclusive", () => {
    const timestamp = 1481040000;

    expect(hasHardfork(timestamp, 15)).toBe(true);
    expect(hasHardfork(timestamp, 16)).toBe(true);
    expect(hasHardfork(timestamp, 17)).toBe(false);
  });
});
