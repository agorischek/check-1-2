import { dirname } from "path";
import { readPackageUpSync, readPackageUp } from "read-package-up";
import type { PackageJsonWithChecks } from "./types.js";

export interface ResolvedOptions {
  scripts: Array<{ name: string; command: string }>;
  runner: string;
  cd: boolean;
  cwd: string;
  format: "auto" | "interactive" | "ci";
}

export interface CLIArgs {
  flags: {
    cd?: boolean;
    runner?: string;
    format?: "auto" | "interactive" | "ci";
  };
}

export interface PackageResult {
  packageJson: PackageJsonWithChecks;
  path: string;
  cwd: string;
}

/**
 * Read both user's package.json and tool's package.json in parallel
 */
export async function readPackagesInParallel(
  userCwd: string,
  toolDir: string,
): Promise<{ userPackage: PackageResult; toolPackage: PackageResult | null }> {
  const [userResult, toolResult] = await Promise.all([
    readPackageUp({ cwd: userCwd }),
    readPackageUp({ cwd: toolDir }),
  ]);

  if (!userResult) {
    throw new Error(`Failed to find package.json starting from ${userCwd}`);
  }

  const { packageJson: rawUserPackageJson, path: userPackageJsonPath } =
    userResult;
  const userPackageJson = rawUserPackageJson as PackageJsonWithChecks;
  const userCwdResolved = dirname(userPackageJsonPath);

  let toolPackageResult: PackageResult | null = null;
  if (toolResult) {
    const { packageJson: rawToolPackageJson, path: toolPackageJsonPath } =
      toolResult;
    const toolPackageJson = rawToolPackageJson as PackageJsonWithChecks;
    const toolCwdResolved = dirname(toolPackageJsonPath);

    toolPackageResult = {
      packageJson: toolPackageJson,
      path: toolPackageJsonPath,
      cwd: toolCwdResolved,
    };
  }

  return {
    userPackage: {
      packageJson: userPackageJson,
      path: userPackageJsonPath,
      cwd: userCwdResolved,
    },
    toolPackage: toolPackageResult,
  };
}

/**
 * Resolve options from a package result (backwards compatible wrapper)
 */
export function resolveOptions(
  cliArgs: CLIArgs,
  cwdOrPackageResult: string | PackageResult = process.cwd(),
): ResolvedOptions {
  let packageResult: PackageResult;

  if (typeof cwdOrPackageResult === "string") {
    // Legacy synchronous path
    const result = readPackageUpSync({ cwd: cwdOrPackageResult });

    if (!result) {
      throw new Error(
        `Failed to find package.json starting from ${cwdOrPackageResult}`,
      );
    }

    const { packageJson: rawPackageJson, path: packageJsonPath } = result;
    const packageJson = rawPackageJson as PackageJsonWithChecks;
    const resolvedCwd = dirname(packageJsonPath);

    packageResult = {
      packageJson,
      path: packageJsonPath,
      cwd: resolvedCwd,
    };
  } else {
    packageResult = cwdOrPackageResult;
  }

  const { packageJson, cwd: resolvedCwd } = packageResult;

  // Get checks - support both array and object syntax
  const checksConfig = packageJson.checks;
  if (!checksConfig) {
    throw new Error('No "checks" property found in package.json');
  }

  let scripts: string[];
  let runner: string = "npm";
  let format: "auto" | "interactive" | "ci" = "auto";

  if (Array.isArray(checksConfig)) {
    // Legacy format: checks: ["lint", "type-check"]
    scripts = checksConfig;
  } else if (typeof checksConfig === "object" && checksConfig.scripts) {
    // New format: checks: { runner: "bun", format: "ci", scripts: ["lint", "type-check"] }
    scripts = checksConfig.scripts;
    runner = checksConfig.runner || "npm";
    format = checksConfig.format || "auto";
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

  // Resolve runner: CLI arg > package.json > default (npm)
  const resolvedRunner = cliArgs.flags.runner || runner;

  // Resolve format: CLI arg > package.json > default (auto)
  const resolvedFormat = cliArgs.flags.format || format;

  // Resolve cd flag: CLI arg (defaults to false)
  const resolvedCd = cliArgs.flags.cd ?? false;

  // Map script names to their commands
  // We've already validated all scripts exist, so they're guaranteed to be defined
  const scriptsWithCommands = scripts.map((name) => ({
    name,
    command: packageScripts[name]!,
  }));

  return {
    scripts: scriptsWithCommands,
    runner: resolvedRunner,
    cd: resolvedCd,
    cwd: resolvedCwd,
    format: resolvedFormat,
  };
}
