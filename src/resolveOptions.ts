import { dirname } from "path";
import { readPackageUpSync, readPackageUp } from "read-package-up";
import type { PackageJsonWithChecks } from "./types.js";

export interface ResolvedOptions {
  scripts: Array<{ check: string; fix?: string }>;
  runner: string;
  cwd: string;
  format: "auto" | "interactive" | "ci";
}

export interface CLIArgs {
  flags: {
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

  let rawScripts: (string | { check: string; fix?: string })[];
  let runner: string = "npm";
  let format: "auto" | "interactive" | "ci" = "auto";

  if (Array.isArray(checksConfig)) {
    // Legacy format: checks: ["lint", "type-check"] or checks: [{ check: "lint", fix: "lint:fix" }]
    rawScripts = checksConfig;
  } else if (typeof checksConfig === "object" && checksConfig.scripts) {
    // New format: checks: { runner: "bun", format: "ci", scripts: ["lint", "type-check"] }
    rawScripts = checksConfig.scripts;
    runner = checksConfig.runner || "npm";
    format = checksConfig.format || "auto";
  } else {
    throw new Error(
      'Invalid "checks" format. Expected array or object with "scripts" property',
    );
  }

  if (rawScripts.length === 0) {
    throw new Error('"checks" array is empty');
  }

  // Get scripts from package.json to validate
  const packageScripts = packageJson.scripts || {};

  // Normalize scripts: convert strings to { check: string, fix?: undefined }
  // and validate that check scripts exist
  const normalizedScripts: Array<{ check: string; fix?: string }> = [];
  const missingChecks: string[] = [];
  const missingFixes: string[] = [];

  for (const script of rawScripts) {
    if (typeof script === "string") {
      // String format: "lint" → { check: "lint", fix: undefined }
      if (!packageScripts[script]) {
        missingChecks.push(script);
      } else {
        normalizedScripts.push({ check: script });
      }
    } else if (typeof script === "object" && script.check) {
      // Object format: { check: "lint", fix: "lint:fix" }
      if (!packageScripts[script.check]) {
        missingChecks.push(script.check);
      } else if (script.fix && !packageScripts[script.fix]) {
        missingFixes.push(script.fix);
      } else {
        normalizedScripts.push({
          check: script.check,
          fix: script.fix,
        });
      }
    } else {
      throw new Error(
        'Invalid script format. Expected string or object with "check" property',
      );
    }
  }

  if (missingChecks.length > 0) {
    throw new Error(`Missing scripts for checks: ${missingChecks.join(", ")}`);
  }

  if (missingFixes.length > 0) {
    throw new Error(`Missing scripts for fixes: ${missingFixes.join(", ")}`);
  }

  // Resolve runner: CLI arg > package.json > default (npm)
  const resolvedRunner = cliArgs.flags.runner || runner;

  // Resolve format: CLI arg > package.json > default (auto)
  const resolvedFormat = cliArgs.flags.format || format;

  return {
    scripts: normalizedScripts,
    runner: resolvedRunner,
    cwd: resolvedCwd,
    format: resolvedFormat,
  };
}
