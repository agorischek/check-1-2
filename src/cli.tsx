#!/usr/bin/env node

import React, { useEffect, useState } from 'react';
import { render, Text } from 'ink';
import { getCheckCommands } from './index.js';
import { runCheck } from './runner.js';
import { CheckUI } from './ui.jsx';
import { CheckResult } from './types.js';

function App() {
  const [results, setResults] = useState<CheckResult[]>([]);
  const [allComplete, setAllComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {
    async function execute() {
      try {
        const checkCommands = getCheckCommands();
        const cwd = process.cwd();
        
        const start = Date.now();
        setStartTime(start);
        
        // Initialize results with running status
        const initialResults: CheckResult[] = checkCommands.map(({ name }) => ({
          name,
          status: 'running' as const,
          stdout: '',
          stderr: '',
          exitCode: null,
          duration: 0,
        }));
        
        setResults(initialResults);

        // Run checks in parallel and update results as they complete
        const promises = checkCommands.map(async ({ name, command }) => {
          const result = await runCheck(name, command, cwd);
          setResults((prev) => {
            const updated = [...prev];
            const index = updated.findIndex((r) => r.name === result.name);
            if (index !== -1) {
              updated[index] = result;
            }
            return updated;
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

  return <CheckUI results={results} allComplete={allComplete} startTime={startTime} />;
}

render(<App />);

