import { spawn } from 'child_process';
import { CheckResult } from './types.js';

export async function runCheck(
  name: string,
  command: string,
  cwd: string,
  onUpdate?: (result: CheckResult) => void
): Promise<CheckResult> {
  const startTime = Date.now();
  const result: CheckResult = {
    name,
    status: 'running',
    stdout: '',
    stderr: '',
    exitCode: null,
    duration: 0,
  };

  return new Promise((resolve) => {
    // Split command into parts for spawn
    const [cmd, ...args] = command.split(/\s+/);
    
    // Preserve color output by setting FORCE_COLOR if we're in a TTY
    const env = { ...process.env };
    if (process.stdout.isTTY) {
      env.FORCE_COLOR = '1';
    }
    
    const child = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env,
    });

    let stdout = '';
    let stderr = '';

    const emitUpdate = () => {
      if (onUpdate) {
        const duration = Date.now() - startTime;
        onUpdate({
          ...result,
          stdout,
          stderr,
          duration,
        });
      }
    };

    child.stdout?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stdout += chunk;
      emitUpdate();
    });

    child.stderr?.on('data', (data: Buffer) => {
      const chunk = data.toString();
      stderr += chunk;
      emitUpdate();
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      result.status = code === 0 ? 'success' : 'failed';
      result.stdout = stdout;
      result.stderr = stderr;
      result.exitCode = code;
      result.duration = duration;
      if (onUpdate) {
        onUpdate(result);
      }
      resolve(result);
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      result.status = 'failed';
      result.stderr = error.message;
      result.exitCode = 1;
      result.duration = duration;
      if (onUpdate) {
        onUpdate(result);
      }
      resolve(result);
    });
  });
}

