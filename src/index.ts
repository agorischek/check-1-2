import { runCheck } from "./runner.js";
import { CheckResult } from "./types.js";
import { ResolvedOptions } from "./resolveOptions.js";

export function getCheckCommands(
  options: ResolvedOptions,
  fix: boolean = false,
): Array<{ name: string; command: string; runner: string }> {
  const { scripts, runner } = options;

  return scripts
    .filter(({ fix: fixScript }) => {
      // When fix flag is set, only include scripts that have a fix script
      // When fix flag is not set, include all scripts
      return fix ? fixScript !== undefined : true;
    })
    .map(({ check, fix: fixScript }) => {
      // Use fix script if fix flag is set, otherwise use check
      const scriptName = fix ? fixScript! : check;

      // Always use script execution: npm run, bun run, yarn run, pnpm run
      let runCommand: string;
      if (
        runner === "npm" ||
        runner === "pnpm" ||
        runner === "yarn" ||
        runner === "bun"
      ) {
        runCommand = `${runner} run ${scriptName}`;
      } else {
        runCommand = `${runner} ${scriptName}`;
      }

      return {
        name: check, // Always use check name for display/identification
        command: runCommand,
        runner,
      };
    });
}

export async function runChecks(
  options: ResolvedOptions,
  fix: boolean = false,
): Promise<CheckResult[]> {
  const checkCommands = getCheckCommands(options, fix);

  // Always run from package.json directory so package managers can find package.json
  const workingDir = options.cwd;

  // Run all checks in parallel
  const promises = checkCommands.map(({ name, command }) => {
    return runCheck(name, command, workingDir);
  });

  const results = await Promise.all(promises);
  return results;
}
