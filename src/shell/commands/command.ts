import { Client, ClientChannel } from 'ssh2';

export interface ICommandOptions {
  client: Client;
  stream: ClientChannel;
  args: string[];
}

export interface ICommand {
  name: string;
  run: (options: ICommandOptions) => Promise<any>;
}
