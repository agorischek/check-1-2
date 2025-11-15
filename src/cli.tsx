#!/usr/bin/env node

import React, { useEffect, useState } from "react";
import { render, Text } from "ink";
import { cli } from "cleye";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getCheckCommands } from "./index.js";
import { runCheck } from "./runner.js";
import { selectRenderer } from "./renderers/index.js";
import { CheckResult } from "./types.js";
import { resolveOptions, readPackagesInParallel } from "./resolveOptions.js";

// Get the directory where this module is located
const __dirname = dirname(fileURLToPath(import.meta.url));
// Get the tool's package root by going up from src/ directory
const toolDir = dirname(__dirname);

// Read both package.json files in parallel
const { userPackage, toolPackage } = await readPackagesInParallel(
  process.cwd(),
  toolDir,
);

// Get version from tool's package.json, fallback to hardcoded version
const toolVersion = toolPackage?.packageJson.version || "0.0.2";

const argv = cli({
  name: "checks",
  version: toolVersion,
  flags: {
    runner: {
      type: String,
      description: "Runner to use (e.g., npm, pnpm, yarn, bun)",
    },
    format: {
      type: String,
      description: "Output format: auto (default), interactive, or ci",
    },
  },
});

// Enable colors in CI environments for Ink
if (process.env.CI || !process.stdout.isTTY) {
  process.env.FORCE_COLOR = "1";
}

// Validate format flag
const formatFlag = argv.flags.format;
if (
  formatFlag &&
  formatFlag !== "auto" &&
  formatFlag !== "interactive" &&
  formatFlag !== "ci"
) {
  console.error(
    `Invalid format: "${formatFlag}". Must be one of: auto, interactive, ci`,
  );
  process.exit(1);
}

const options = resolveOptions(
  {
    ...argv,
    flags: {
      ...argv.flags,
      format:
        formatFlag === "auto" ||
        formatFlag === "interactive" ||
        formatFlag === "ci"
          ? formatFlag
          : undefined,
    },
  },
  userPackage,
);

// Select renderer once at module level based on format option
const Renderer = selectRenderer(options.format);

function App() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [allComplete, setAllComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    async function execute() {
      try {
        const checkCommands = getCheckCommands(options);

        const start = Date.now();
        setStartTime(start);

        // Initialize results with running status
        const initialResults: CheckResult[] = checkCommands.map(({ name }) => ({
          name,
          status: "running" as const,
          stdout: "",
          stderr: "",
          exitCode: null,
          duration: 0,
        }));

        setResults(initialResults);

        // Always run from package.json directory so package managers can find package.json
        const workingDir = options.cwd;

        // Run checks in parallel and update results as they stream
        const promises = checkCommands.map(async ({ name, command }) => {
          const result = await runCheck(
            name,
            command,
            workingDir,
            (updatedResult) => {
              // Update results in real-time as output streams
              setResults((prev) => {
                const updated = [...prev];
                const index = updated.findIndex(
                  (r) => r.name === updatedResult.name,
                );
                if (index !== -1) {
                  updated[index] = updatedResult;
                }
                return updated;
              });
            },
          );
          return result;
        });

        await Promise.all(promises);
        setAllComplete(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
        setAllComplete(true);
      }
    }

    execute();
  }, []);

  if (error) {
    return <Text color="red">Error: {error}</Text>;
  }

  return (
    <Renderer
      results={results}
      allComplete={allComplete}
      startTime={startTime}
    />
  );
}

render(<App />);
