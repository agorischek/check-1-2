import { spawn } from 'child_process';
import { CheckResult } from './types.js';

export async function runCheck(
  name: string,
  command: string,
  cwd: string
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
    
    const child = spawn(cmd, args, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      const duration = Date.now() - startTime;
      result.status = code === 0 ? 'success' : 'failed';
      result.stdout = stdout;
      result.stderr = stderr;
      result.exitCode = code;
      result.duration = duration;
      resolve(result);
    });

    child.on('error', (error) => {
      const duration = Date.now() - startTime;
      result.status = 'failed';
      result.stderr = error.message;
      result.exitCode = 1;
      result.duration = duration;
      resolve(result);
    });
  });
}

