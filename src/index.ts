import { runCheck } from "./runner.js";
import { CheckResult } from "./types.js";
import { ResolvedOptions } from "./resolveOptions.js";

export function getCheckCommands(
  options: ResolvedOptions,
): Array<{ name: string; command: string; runner: string }> {
  const { scripts, runner, cd, cwd } = options;

  return scripts.map(({ name, command: scriptCommand }) => {
    // Build command using npx (or specified runner)
    // For npx, we run the actual script command with npx
    // For other runners, use their standard format
    let runCommand: string;
    if (runner === "npx") {
      // Extract the first word (package name) from the script command
      // e.g., "eslint ." -> "npx -y eslint ."
      const parts = scriptCommand.trim().split(/\s+/);
      const packageName = parts[0];
      const args = parts.slice(1).join(" ");
      runCommand = args ? `npx -y ${packageName} ${args}` : `npx -y ${packageName}`;
    } else if (
      runner === "npm" ||
      runner === "pnpm" ||
      runner === "yarn" ||
      runner === "bun"
    ) {
      runCommand = `${runner} run ${name}`;
    } else {
      runCommand = `${runner} ${name}`;
    }

    // If --cd flag is set, prepend cd command
    const command = cd ? `cd ${cwd} && ${runCommand}` : runCommand;

    return {
      name,
      command,
      runner,
    };
  });
}

export async function runChecks(
  options: ResolvedOptions,
): Promise<CheckResult[]> {
  const checkCommands = getCheckCommands(options);

  // Run all checks in parallel
  const promises = checkCommands.map(({ name, command }) => {
    return runCheck(name, command, options.cwd);
  });

  const results = await Promise.all(promises);
  return results;
}
