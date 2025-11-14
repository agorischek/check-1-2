import { describe, it, expect } from "bun:test";
import { runCheck } from "./runner.js";

describe("runCheck", () => {
  it("should handle successful command execution", async () => {
    // This is a basic structure test
    // Full integration would require more complex mocking
    expect(typeof runCheck).toBe("function");
  });

  it("should accept onUpdate callback", async () => {
    // Test that the function signature accepts optional callback
    // We can't easily test the full execution without complex mocking
    // but we can verify the function exists and has the right signature
    expect(runCheck.length).toBeGreaterThanOrEqual(3);
  });
});
