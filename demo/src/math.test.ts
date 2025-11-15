import { add } from "./math";

describe("math functions", () => {
  test("add should return sum", () => {
    expect(add(2, 3)).toBe(5);
  });
});
