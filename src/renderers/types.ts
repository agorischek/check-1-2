import { CheckResult } from "../types.js";

export interface RendererProps {
  results: CheckResult[];
  allComplete: boolean;
  startTime: number | null;
}

export interface Renderer {
  render(props: RendererProps): void;
  update(props: RendererProps): void;
  cleanup(): void;
}
