export interface CheckResult {
  name: string;
  status: "running" | "success" | "failed";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  duration: number;
}

export interface PackageJson {
  checks?:
    | string[]
    | {
        runner?: string;
        format?: "auto" | "interactive" | "ci";
        scripts: string[];
      };
  scripts?: Record<string, string>;
}
