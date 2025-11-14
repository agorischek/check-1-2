import React, { useEffect } from 'react';
import { Box, Text, useApp } from 'ink';
import { CheckResult } from './types.js';

interface CheckUIProps {
  results: CheckResult[];
  allComplete: boolean;
  startTime: number | null;
}

function CheckItem({ result }: { result: CheckResult }) {
  const getStatusSymbol = () => {
    switch (result.status) {
      case 'running':
        return '⏳';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case 'running':
        return 'yellow';
      case 'success':
        return 'green';
      case 'failed':
        return 'red';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text>
          {getStatusSymbol()} <Text color={getStatusColor()}>{result.name}</Text>
          {result.status !== 'running' && (
            <Text dimColor> ({formatDuration(result.duration)})</Text>
          )}
        </Text>
      </Box>
      {result.status === 'failed' && (
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {result.stdout && (
            <Box flexDirection="column" marginBottom={1}>
              <Text color="gray" dimColor>STDOUT:</Text>
              <Text>{result.stdout}</Text>
            </Box>
          )}
          {result.stderr && (
            <Box flexDirection="column">
              <Text color="red" dimColor>STDERR:</Text>
              <Text color="red">{result.stderr}</Text>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

export function CheckUI({ results, allComplete, startTime }: CheckUIProps) {
  const { exit } = useApp();

  useEffect(() => {
    if (allComplete) {
      const hasFailures = results.some((r) => r.status === 'failed');
      // Exit with appropriate code after a brief delay to show final state
      setTimeout(() => {
        exit();
        process.exit(hasFailures ? 1 : 0);
      }, 100);
    }
  }, [allComplete, results, exit]);

  const successCount = results.filter((r) => r.status === 'success').length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const runningCount = results.filter((r) => r.status === 'running').length;
  
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const totalDuration = startTime ? Date.now() - startTime : 0;

  return (
    <Box flexDirection="column" padding={1}>
      <Box flexDirection="column" marginBottom={1}>
        {results.map((result) => (
          <CheckItem key={result.name} result={result} />
        ))}
      </Box>
      
      {allComplete && (
        <Box flexDirection="column" marginTop={1} borderTop={true}>
          <Text bold>
            Summary: {successCount} passed, {failedCount} failed
            {runningCount > 0 && `, ${runningCount} running`}
          </Text>
          <Text dimColor>
            Total time: {formatDuration(totalDuration)}
          </Text>
          {failedCount > 0 && (
            <Text color="red" bold>
              Some checks failed!
            </Text>
          )}
          {failedCount === 0 && successCount > 0 && (
            <Text color="green" bold>
              All checks passed! 🎉
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}

