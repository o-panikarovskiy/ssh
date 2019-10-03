import { EventEmitter } from 'events';
import { emitKeypressEvents } from 'readline';
import { Client, ClientChannel } from 'ssh2';
import { ICommand, ICommandOptions } from './commands/command';

export function startShell(client: Client, commands: ICommand[]) {
  return new Promise((resolve, reject) => {
    client.shell((err, stream) => {
      if (err) { return reject(err); }
      resolve(new ClientShell(client, stream, commands));
    });
  });
}

class ClientShell extends EventEmitter {
  private rawMode = false;
  private stdoutBuf = new Buffer('', 'utf-8');

  constructor(
    private readonly client: Client,
    private readonly stream: ClientChannel,
    private readonly commands: ICommand[],
  ) {
    super();

    this.rawMode = !!process.stdin.isRaw;
    emitKeypressEvents(process.stdin);
    if (process.stdin.setRawMode) { process.stdin.setRawMode(true); }
    process.stdin.on('keypress', this.onKeypress);
    process.on('SIGINT', this.onTerminate);

    stream.on('data', this.onData).on('close', this.destroy);
  }

  private async runCommand(command: ICommand, options: ICommandOptions) {
    process.stdin.pause();
    this.stream.off('data', this.onData);
    this.stream.write('\n');

    try {
      await command.run(options);
    } catch (error) {
      process.stdout.write('\n' + (typeof error === 'string' ? error : error.message));
    }

    process.stdin.resume();
    this.stream.on('data', this.onData);
    this.stream.write('\n');
  }

  private onEnter() {
    this.stream.write('\n');

    const lines = this.stdoutBuf.toString('utf-8').split('\n');
    this.stdoutBuf = new Buffer('', 'utf-8');

    const res = this.parseInputLine(lines[lines.length - 1]);
    if (!res) { return; }

    const { options, command } = res;
    if (command) {
      this.runCommand(command, { ...options, client: this.client, stream: this.stream });
    }
  }

  private parseInputLine(line: string) {
    const matches = line.match(/:(.+)\$ (.+)/);
    if (!matches || matches.length !== 3) { return; }

    const currentPath = matches[1];
    const [commandName, ...args] = matches[2].trim().split(' ');

    const command = this.commands.find(c => c.canRun(commandName, args));

    return { command, options: { currentPath, commandName, args } };
  }

  private onData = (data: Buffer) => {
    process.stdin.pause();
    process.stdout.write(data);
    process.stdin.resume();
    this.stdoutBuf = Buffer.concat([this.stdoutBuf, data]);
  }

  private onKeypress = async (str: string, key: any) => {
    if (key.ctrl && key.name === 'c') {
      this.onTerminate();
    } else if (key.name === 'return') {
      this.onEnter();
    } else if (key.sequence) {
      this.stream.write(key.sequence);
    }
  }

  private onTerminate = () => {
    this.stream.write('\x03');
  }

  private destroy = () => {
    this.client.end();
    process.stdin.pause();
    process.stdin.off('keypress', this.onKeypress);
    process.off('SIGINT', this.onTerminate);
    if (process.stdin.setRawMode) { process.stdin.setRawMode(this.rawMode!); }
  }
}
