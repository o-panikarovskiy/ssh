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
  private line = '';
  private rawMode = false;

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
      process.stdout.write(`\n${typeof error === 'string' ? error : error.message}\n`);
    }

    setTimeout(() => {
      this.stream.on('data', this.onData);
      this.stream.write('\n');
      process.stdin.resume();
    }, 500);
  }

  private onEnter() {
    const lines = this.line.split('\n');
    const input = lines[lines.length - 1];

    this.line = '';

    const res = this.parseInputLine(input);
    if (res) {
      const { options, command } = res;
      this.runCommand(command, { ...options, client: this.client, stream: this.stream });
    } else {
      this.stream.write('\n');
    }
  }

  private parseInputLine(line: string) {
    const matches = line.match(/\$ (.+)/);
    if (!matches || matches.length !== 2) { return; }

    const [commandName, ...args] = matches[1].trim().split(' ').reduce((acc, a) => {
      a = a.trim();
      if (a) { acc.push(a); }
      return acc;
    }, [] as string[]);

    const command = this.commands.find(c => c.name === commandName);
    if (!command) { return; }

    return { command, options: {  args } };
  }

  private onData = (data: Buffer) => {
    const str = data.toString('utf-8');
    this.line += str;

    process.stdin.pause();
    process.stdout.write(data);
    process.stdin.resume();
  }

  private onKeypress = async (str: string, key: any) => {
    if (key.ctrl && key.name === 'c') {
      this.onTerminate();
    } else if (key.name === 'return') {
      this.onEnter();
    } else {
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
