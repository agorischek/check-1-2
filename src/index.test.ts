import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { writeFileSync, unlinkSync, mkdirSync, rmdirSync } from "fs";
import { join } from "path";
import { getCheckCommands } from "./index.js";
import { resolveOptions } from "./resolveOptions.js";

describe("getCheckCommands", () => {
  const testDir = join(process.cwd(), ".test-tmp");
  const packageJsonPath = join(testDir, "package.json");

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    try {
      unlinkSync(packageJsonPath);
      rmdirSync(testDir);
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should parse legacy array format", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
        test: "jest",
        build: "tsc",
      },
      checks: ["lint", "test", "build"],
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands).toHaveLength(3);
    expect(commands[0]).toEqual({
      name: "lint",
      command: "npm run lint",
      runner: "npm",
    });
    expect(commands[1]).toEqual({
      name: "test",
      command: "npm run test",
      runner: "npm",
    });
    expect(commands[2]).toEqual({
      name: "build",
      command: "npm run build",
      runner: "npm",
    });
  });

  it("should parse object format with runner", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
        test: "jest",
      },
      checks: {
        runner: "bun",
        scripts: ["lint", "test"],
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands).toHaveLength(2);
    expect(commands[0]).toEqual({
      name: "lint",
      command: "bun run lint",
      runner: "bun",
    });
    expect(commands[1]).toEqual({
      name: "test",
      command: "bun run test",
      runner: "bun",
    });
  });

  it("should default to npm when runner is not specified", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: {
        scripts: ["lint"],
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands).toHaveLength(1);
    expect(commands[0].runner).toBe("npm");
    expect(commands[0].command).toBe("npm run lint");
  });

  it("should support pnpm runner", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: {
        runner: "pnpm",
        scripts: ["lint"],
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands[0].command).toBe("pnpm run lint");
  });

  it("should support yarn runner", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: {
        runner: "yarn",
        scripts: ["lint"],
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands[0].command).toBe("yarn run lint");
  });

  it("should throw error when checks property is missing", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    expect(() => resolveOptions({ flags: {} }, testDir)).toThrow(
      'No "checks" property found in package.json',
    );
  });

  it("should throw error when checks array is empty", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: [],
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    expect(() => resolveOptions({ flags: {} }, testDir)).toThrow('"checks" array is empty');
  });

  it("should throw error when script is missing", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: ["lint", "missing-script"],
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    expect(() => resolveOptions({ flags: {} }, testDir)).toThrow(
      "Missing scripts for checks: missing-script",
    );
  });

  it("should throw error for invalid checks format", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: { invalid: "format" },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    expect(() => resolveOptions({ flags: {} }, testDir)).toThrow('Invalid "checks" format. Expected array or object with "scripts" property');
  });

  it("should handle custom runner format", () => {
    const packageJson = {
      scripts: {
        lint: "eslint .",
      },
      checks: {
        runner: "custom-runner",
        scripts: ["lint"],
      },
    };

    writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

    const options = resolveOptions({ flags: {} }, testDir);
    const commands = getCheckCommands(options);

    expect(commands[0].command).toBe("custom-runner lint");
  });
});
