import { spawn } from 'child_process';

export function tunnel(args: string[]) {
  const ssh = spawn('ssh', args);
  process.on('exit', () => ssh.kill());
}
