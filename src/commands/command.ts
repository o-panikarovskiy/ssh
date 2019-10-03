import { Client, ClientChannel } from 'ssh2';

export interface ICommandOptions {
  client: Client;
  stream: ClientChannel;
  currentPath: string;
  commandName: string;
  args: string[];
}

export interface ICommand {
  canRun: (commandName: string, args?: string[]) => boolean;
  run: (options: ICommandOptions) => Promise<any>;
}
