import React, { useEffect } from "react";
import { Box, Text, useApp } from "ink";
import { CheckResult } from "../types.js";
import { RendererProps } from "./types.js";

function CheckItem({ result }: { result: CheckResult }) {
  const getStatusSymbol = () => {
    switch (result.status) {
      case "running":
        return "○";
      case "success":
        return "✓";
      case "failed":
        return "×";
    }
  };

  const getStatusColor = () => {
    switch (result.status) {
      case "running":
        return "gray";
      case "success":
        return "green";
      case "failed":
        return "red";
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Get output lines (combine stdout and stderr)
  const getOutputLines = (): string[] => {
    const lines: string[] = [];

    if (result.stdout) {
      const stdoutLines = result.stdout
        .split("\n")
        .filter((line) => line.trim() || line.length > 0);
      lines.push(...stdoutLines);
    }
    if (result.stderr) {
      const stderrLines = result.stderr
        .split("\n")
        .filter((line) => line.trim() || line.length > 0);
      lines.push(...stderrLines);
    }

    // Show placeholder only if running and no output yet
    if (result.status === "running" && lines.length === 0) {
      lines.push("…");
    }

    return lines;
  };

  const outputLines = getOutputLines();
  const showOutput = result.status === "running" || outputLines.length > 0;

  return (
    <Box flexDirection="column" marginBottom={2} marginTop={1}>
      {/* Header: Box with round outline containing script name and duration */}
      <Box borderStyle="round" paddingX={1} flexDirection="row">
        <Box flexGrow={1}>
          <Text color={getStatusColor()} bold>
            {getStatusSymbol()} {result.name}
          </Text>
        </Box>
        {result.status !== "running" && (
          <Text dimColor>({formatDuration(result.duration)})</Text>
        )}
      </Box>

      {/* Output lines */}
      {showOutput && (
        <Box flexDirection="column" marginTop={0}>
          {outputLines.map((line, index) => (
            <Text key={index}>{line || " "}</Text>
          ))}
        </Box>
      )}

      {/* Extra blank line in CI between sections */}
      {result.status !== "running" && <Text> </Text>}
    </Box>
  );
}

export function CIRenderer({ results, allComplete, startTime }: RendererProps) {
  const { exit } = useApp();

  useEffect(() => {
    if (allComplete) {
      const hasFailures = results.some((r) => r.status === "failed");
      // Exit with appropriate code after a brief delay to show final state
      setTimeout(() => {
        exit();
        process.exit(hasFailures ? 1 : 0);
      }, 100);
    }
  }, [allComplete, results, exit]);

  const failedCount = results.filter((r) => r.status === "failed").length;

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const totalDuration = startTime ? Date.now() - startTime : 0;

  // In CI, only show bottom section when all complete
  const showBottomSection = allComplete;

  return (
    <Box flexDirection="column" height="100%">
      {/* Scrollable output area */}
      <Box flexDirection="column" flexGrow={1} paddingX={1} paddingY={1}>
        {results.map((result) => (
          <CheckItem key={result.name} result={result} />
        ))}
      </Box>

      {/* Fixed bottom section - delayed in CI until completion */}
      {showBottomSection && (
        <Box
          flexDirection="column"
          borderTop={true}
          paddingX={1}
          paddingY={1}
          marginTop={-1}
        >
          {/* List all checks with status */}
          {results.map((result) => {
            let statusElement: React.ReactNode;
            if (result.status === "running") {
              statusElement = <Text>…</Text>;
            } else if (result.status === "success") {
              statusElement = <Text color="green">✓</Text>;
            } else {
              statusElement = <Text color="red">×</Text>;
            }

            return (
              <Box key={result.name} flexDirection="row">
                <Box width={2}>{statusElement}</Box>
                <Text bold>{result.name}</Text>
              </Box>
            );
          })}

          {/* Overall status line */}
          <Box marginTop={1}>
            {failedCount > 0 ? (
              <Text color="red" bold>
                {failedCount} {failedCount === 1 ? "check" : "checks"} failed{" "}
                <Text dimColor>({formatDuration(totalDuration)})</Text>
              </Text>
            ) : (
              <Text color="green" bold>
                All checks passed{" "}
                <Text dimColor>({formatDuration(totalDuration)})</Text>
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
