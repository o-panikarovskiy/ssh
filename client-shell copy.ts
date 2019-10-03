// import { EventEmitter } from 'events';
// import { emitKeypressEvents } from 'readline';
// import { Client, ClientChannel } from 'ssh2';
// import { ICommand } from './commands/command';

// export function startShell(client: Client, commands: ICommand[]) {
//   return new Promise((resolve, reject) => {
//     client.shell((err, stream) => {
//       if (err) { return reject(err); }
//       resolve(new ClientShell(client, stream, commands));
//     });
//   });
// }

// class ClientShell extends EventEmitter {
//   private rawMode = false;
//   private line = '';

//   constructor(
//     private readonly client: Client,
//     private readonly stream: ClientChannel,
//     private readonly commands: ICommand[],
//   ) {
//     super();

//     this.rawMode = !!process.stdin.isRaw;
//     emitKeypressEvents(process.stdin);
//     if (process.stdin.setRawMode) { process.stdin.setRawMode(true); }
//     process.stdin.on('keypress', this.onKeypress);
//     process.on('SIGINT', this.onTerminate);

//     stream.on('data', this.onData).on('close', this.destroy);
//   }

//   private findCommand(args: string[]): ICommand | undefined {
//     return this.commands.find(c => c.canRun(args));
//   }

//   private async runCommand(cmd: ICommand, args: string[]) {
//     process.stdin.pause();
//     this.stream.off('data', this.onData);
//     this.stream.write('\n');

//     try {
//       await cmd.run(this.client, this.stream, args);
//     } catch (error) {
//       process.stdout.write('\n' + (typeof error === 'string' ? error : error.message));
//     }

//     process.stdin.resume();
//     this.stream.on('data', this.onData);
//     this.stream.write('\n');
//   }

//   private onData = (data: Buffer) => {
//     process.stdin.pause();
//     process.stdout.write(data);
//     process.stdin.resume();
//   }

//   private onKeypress = async (str: string, key: any) => {
//     if (key.ctrl && key.name === 'c') {
//       this.onTerminate();
//     } else if (key.name === 'return') {
//       const args = this.line.split(' ');
//       const cmd = this.findCommand(args);

//       this.stream.write('\n');
//       if (cmd && !cmd) { this.runCommand(cmd, args); }

//       this.line = '';
//     } else if (key.sequence) {
//       this.line += str;
//       this.stream.write(key.sequence);
//     }
//   }

//   private onTerminate = () => {
//     this.stream.write('\x03');
//   }

//   private destroy = () => {
//     this.client.end();
//     process.stdin.pause();
//     process.stdin.off('keypress', this.onKeypress);
//     process.off('SIGINT', this.onTerminate);
//     if (process.stdin.setRawMode) { process.stdin.setRawMode(this.rawMode!); }
//   }
// }
