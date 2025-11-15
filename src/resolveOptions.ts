import { readFileSync } from "fs";
import { join } from "path";
import { PackageJson } from "./types.js";

export interface ResolvedOptions {
  scripts: Array<{ name: string; command: string }>;
  runner: string;
  cd: boolean;
  cwd: string;
}

export interface CLIArgs {
  flags: {
    cd?: boolean;
    runner?: string;
  };
}

export function resolveOptions(
  cliArgs: CLIArgs,
  cwd: string = process.cwd(),
): ResolvedOptions {
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

  let scripts: string[];
  let runner: string = "npx";

  if (Array.isArray(checksConfig)) {
    // Legacy format: checks: ["lint", "type-check"]
    scripts = checksConfig;
  } else if (typeof checksConfig === "object" && checksConfig.scripts) {
    // New format: checks: { runner: "bun", scripts: ["lint", "type-check"] }
    scripts = checksConfig.scripts;
    runner = checksConfig.runner || "npx";
  } else {
    throw new Error(
      'Invalid "checks" format. Expected array or object with "scripts" property',
    );
  }

  if (scripts.length === 0) {
    throw new Error('"checks" array is empty');
  }

  // Get scripts from package.json to validate and get commands
  const packageScripts = packageJson.scripts || {};

  // Validate all checks exist as scripts
  const missing = scripts.filter((script) => !packageScripts[script]);
  if (missing.length > 0) {
    throw new Error(`Missing scripts for checks: ${missing.join(", ")}`);
  }

  // Resolve runner: CLI arg > package.json > default (npx)
  const resolvedRunner = cliArgs.flags.runner || runner;

  // Resolve cd flag: CLI arg (defaults to false)
  const resolvedCd = cliArgs.flags.cd ?? false;

  // Map script names to their commands
  const scriptsWithCommands = scripts.map((name) => ({
    name,
    command: packageScripts[name],
  }));

  return {
    scripts: scriptsWithCommands,
    runner: resolvedRunner,
    cd: resolvedCd,
    cwd,
  };
}
