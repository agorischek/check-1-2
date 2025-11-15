import { InteractiveRenderer } from "./interactive.js";
import { CIRenderer } from "./ci.js";
import { RendererProps } from "./types.js";

export function selectRenderer(): React.ComponentType<RendererProps> {
  const isCI = Boolean(process.env.CI || !process.stdout.isTTY);

  return isCI ? CIRenderer : InteractiveRenderer;
}

export { InteractiveRenderer } from "./interactive.js";
export { CIRenderer } from "./ci.js";
export type { RendererProps } from "./types.js";
