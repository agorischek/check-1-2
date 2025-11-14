import { readFileSync } from "fs";
import { join } from "path";
import { runCheck } from "./runner.js";
import { CheckResult, PackageJson } from "./types.js";

export function getCheckCommands(
  cwd: string = process.cwd(),
): Array<{ name: string; command: string; runner: string }> {
  // Read package.json
  const packageJsonPath = join(cwd, "package.json");
  let packageJson: PackageJson;

  try {
    const content = readFileSync(packageJsonPath, "utf-8");
    packageJson = JSON.parse(content);
  } catch (error) {
    throw new Error(
      `Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // Get checks - support both array and object syntax
  const checksConfig = packageJson.checks;
  if (!checksConfig) {
    throw new Error('No "checks" property found in package.json');
  }

  let checks: string[];
  let runner: string = "npm";

  if (Array.isArray(checksConfig)) {
    // Legacy format: checks: ["lint", "type-check"]
    checks = checksConfig;
  } else if (typeof checksConfig === "object" && checksConfig.scripts) {
    // New format: checks: { runner: "bun", scripts: ["lint", "type-check"] }
    checks = checksConfig.scripts;
    runner = checksConfig.runner || "npm";
  } else {
    throw new Error(
      'Invalid "checks" format. Expected array or object with "scripts" property',
    );
  }

  if (checks.length === 0) {
    throw new Error('"checks" array is empty');
  }

  // Get scripts
  const scripts = packageJson.scripts || {};

  // Validate all checks exist as scripts
  const missing = checks.filter((check) => !scripts[check]);
  if (missing.length > 0) {
    throw new Error(`Missing scripts for checks: ${missing.join(", ")}`);
  }

  // Return check commands with runner
  return checks.map((check) => {
    // Build command based on runner
    // npm/pnpm/yarn use "run", bun uses "run" as well
    const runCommand =
      runner === "npm" ||
      runner === "pnpm" ||
      runner === "yarn" ||
      runner === "bun"
        ? `${runner} run ${check}`
        : `${runner} ${check}`;

    return {
      name: check,
      command: runCommand,
      runner,
    };
  });
}

export async function runChecks(
  cwd: string = process.cwd(),
): Promise<CheckResult[]> {
  const checkCommands = getCheckCommands(cwd);

  // Run all checks in parallel
  const promises = checkCommands.map(({ name, command }) => {
    return runCheck(name, command, cwd);
  });

  const results = await Promise.all(promises);
  return results;
}
