import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useStdout } from "ink";
import { CheckResult } from "./types.js";

// Simple spinner component
function Spinner() {
  const { stdout } = useStdout();
  const isTTY = stdout.isTTY ?? false;
  const [frame, setFrame] = useState(0);
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

  useEffect(() => {
    // Only animate spinner in TTY environments
    // In CI/non-TTY, show a static indicator
    if (!isTTY) return;

    const interval = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(interval);
  }, [frames.length, isTTY]);

  // In non-TTY (CI), show a static indicator instead of animated spinner
  return <Text>{isTTY ? frames[frame] : "…"}</Text>;
}

interface CheckUIProps {
  results: CheckResult[];
  allComplete: boolean;
  startTime: number | null;
}

function CheckItem({ result }: { result: CheckResult }) {
  const { stdout } = useStdout();
  const terminalWidth = stdout.columns || 80;

  const getStatusSymbol = () => {
    switch (result.status) {
      case "running":
        return "...";
      case "success":
        return "✓";
      case "failed":
        return "×";
    }
  };

  const getStatusBgColor = () => {
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

  // Wrap text to terminal width, accounting for the "│ " prefix (2 chars)
  const wrapText = (text: string, width: number): string[] => {
    const maxWidth = Math.max(10, width - 2); // Account for "│ " prefix
    if (text.length <= maxWidth) {
      return [text];
    }

    const lines: string[] = [];
    const words = text.split(/\s+/).filter((w) => w.length > 0);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push(currentLine);
        }
        // If a single word is longer than maxWidth, break it
        if (word.length > maxWidth) {
          let remaining = word;
          while (remaining.length > maxWidth) {
            lines.push(remaining.substring(0, maxWidth));
            remaining = remaining.substring(maxWidth);
          }
          currentLine = remaining;
        } else {
          currentLine = word;
        }
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    return lines.length > 0 ? lines : [""];
  };

  // Get output lines (combine stdout and stderr)
  const getOutputLines = (): string[] => {
    const lines: string[] = [];

    // Show all output, including while running (streaming)
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
      lines.push("...");
    }

    return lines;
  };

  const outputLines = getOutputLines();
  const showOutput = result.status === "running" || outputLines.length > 0;

  return (
    <Box flexDirection="column" marginBottom={1}>
      {/* Header: ┌ [ ✓ name ] */}
      <Box>
        <Text dimColor>┌ </Text>
        <Text backgroundColor={getStatusBgColor()}>
          {" "}
          {getStatusSymbol()} {result.name}{" "}
        </Text>
      </Box>

      {/* Blank line with bar after header */}
      <Text dimColor>│ </Text>

      {/* Output lines: │ ... with wrapping support */}
      {showOutput && (
        <Box flexDirection="column">
          {outputLines.flatMap((line, index) => {
            // Wrap each line to terminal width
            const wrappedLines = wrapText(line || " ", terminalWidth);
            return wrappedLines.map((wrappedLine, wrapIndex) => (
              <Text key={`${index}-${wrapIndex}`}>
                <Text dimColor>│</Text> {wrappedLine}
              </Text>
            ));
          })}
        </Box>
      )}

      {/* Blank line before footer, only if there was output */}
      {showOutput && result.status !== "running" && <Text dimColor>│ </Text>}

      {/* Footer: └ (duration) */}
      {result.status !== "running" && (
        <Text dimColor>
          └ <Text dimColor>({formatDuration(result.duration)})</Text>
        </Text>
      )}
    </Box>
  );
}

export function CheckUI({ results, allComplete, startTime }: CheckUIProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();

  // Detect CI environment
  const isCI = Boolean(process.env.CI || !stdout.isTTY);

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
  // In TTY, always show it
  const showBottomSection = !isCI || allComplete;

  return (
    <Box flexDirection="column" height="100%">
      {/* Scrollable output area */}
      <Box flexDirection="column" flexGrow={1} padding={1}>
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
          {/* List all checks with spinners/status */}
          {results.map((result) => {
            let statusElement: React.ReactNode;
            if (result.status === "running") {
              statusElement = <Spinner />;
            } else if (result.status === "success") {
              statusElement = <Text color="green">✓</Text>;
            } else {
              statusElement = <Text color="red">×</Text>;
            }

            return (
              <Box key={result.name} flexDirection="row">
                <Box width={2}>{statusElement}</Box>
                <Text>{result.name}</Text>
              </Box>
            );
          })}

          {/* Overall status line */}
          <Box marginTop={1}>
            {!allComplete ? (
              <Text color="yellow">
                Running...{" "}
                <Text dimColor>({formatDuration(totalDuration)})</Text>
              </Text>
            ) : failedCount > 0 ? (
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
