import type { PackageJson } from "read-package-up";

export interface CheckResult {
  name: string;
  status: "running" | "success" | "failed";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

/**
 * Extended PackageJson with our custom 'checks' property
 */
export type PackageJsonWithChecks = PackageJson & {
  checks?:
    | (string | { check: string; fix?: string })[]
    | {
        runner?: string;
        format?: "auto" | "interactive" | "ci";
        scripts: (string | { check: string; fix?: string })[];
      };
};
