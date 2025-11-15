import { InteractiveRenderer } from "./interactive.js";
import { CIRenderer } from "./ci.js";
import { RendererProps } from "./types.js";

export function selectRenderer(
  format: "auto" | "interactive" | "ci" = "auto",
): React.ComponentType<RendererProps> {
  if (format === "ci") {
    return CIRenderer;
  }
  if (format === "interactive") {
    return InteractiveRenderer;
  }
  // format === "auto" - detect based on environment
  const isCI = Boolean(process.env.CI || !process.stdout.isTTY);
  return isCI ? CIRenderer : InteractiveRenderer;
}

export { InteractiveRenderer } from "./interactive.js";
export { CIRenderer } from "./ci.js";
export type { RendererProps } from "./types.js";
