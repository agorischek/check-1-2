import { readFileSync } from 'fs';
import { join } from 'path';
import { runCheck } from './runner.js';
import { CheckResult, PackageJson } from './types.js';

export function getCheckCommands(cwd: string = process.cwd()): Array<{ name: string; command: string }> {
  // Read package.json
  const packageJsonPath = join(cwd, 'package.json');
  let packageJson: PackageJson;
  
  try {
    const content = readFileSync(packageJsonPath, 'utf-8');
    packageJson = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read package.json: ${error instanceof Error ? error.message : String(error)}`);
  }

  // Get checks array
  const checks = packageJson.checks;
  if (!checks || !Array.isArray(checks) || checks.length === 0) {
    throw new Error('No "checks" array found in package.json or it is empty');
  }

  // Get scripts
  const scripts = packageJson.scripts || {};
  
  // Validate all checks exist as scripts
  const missing = checks.filter((check) => !scripts[check]);
  if (missing.length > 0) {
    throw new Error(`Missing scripts for checks: ${missing.join(', ')}`);
  }

  // Return check commands
  return checks.map((check) => ({
    name: check,
    command: scripts[check],
  }));
}

export async function runChecks(cwd: string = process.cwd()): Promise<CheckResult[]> {
  const checkCommands = getCheckCommands(cwd);
  
  // Run all checks in parallel
  const promises = checkCommands.map(({ name, command }) => {
    return runCheck(name, command, cwd);
  });

  const results = await Promise.all(promises);
  return results;
}

