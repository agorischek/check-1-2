#!/usr/bin/env node

import React, { useEffect, useState } from "react";
import { render, Text } from "ink";
import { cli } from "cleye";
import { getCheckCommands } from "./index.js";
import { runCheck } from "./runner.js";
import { CheckUI } from "./ui.js";
import { CheckResult } from "./types.js";

const argv = cli({
  name: "checks",
  version: "0.0.2",
  parameters: ["[cwd]"],
  flags: {
    cwd: {
      type: String,
      description: "Working directory to run checks from",
    },
  },
});

// Determine working directory: --cwd flag > positional argument > current directory
const cwd = argv.flags.cwd || argv._[0] || process.cwd();

function App() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [allComplete, setAllComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    async function execute() {
      try {
        const checkCommands = getCheckCommands(cwd);

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

        // Run checks in parallel and update results as they stream
        const promises = checkCommands.map(async ({ name, command }) => {
          const result = await runCheck(name, command, cwd, (updatedResult) => {
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
          });
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
    <CheckUI
      results={results}
      allComplete={allComplete}
      startTime={startTime}
    />
  );
}

render(<App />);
