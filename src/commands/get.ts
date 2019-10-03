import * as path from 'path';
import { Client, SFTPWrapper } from 'ssh2';
import { ICommand, ICommandOptions } from './command';

export default function create() {
  return new GetCommand();
}

class GetCommand implements ICommand {
  public canRun(commandName: string) {
    return commandName === 'get';
  }

  public async run(options: ICommandOptions) {
    const { client, currentPath, args } = options;

    if (!args[0]) { throw new Error('No such file'); }

    const remotePath = this.getRemotePath(currentPath, args[0].trim());
    const localPath = path.join(path.dirname(process.argv[1]), path.basename(remotePath));

    process.stdout.write(`\n[${this.getTime()}] Downloading from ${remotePath} to 127.0.0.1:${localPath}`);
    await this.task(client, remotePath, localPath);
    process.stdout.write(`\n[${this.getTime()}] File is downloaded successfully`);
  }

  private getRemotePath(currentPath: string, filePath: string) {
    if (filePath.startsWith('.') || filePath.startsWith('/')) { return filePath; }
    return path.join(currentPath, filePath);
  }

  private async task(client: Client, remotePath: string, localPath: string) {
    const sftp = await this.sftp(client);

    return new Promise((resolve, reject) => {
      sftp.fastGet(remotePath, localPath, err => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  private getTime() {
    return (new Date()).toJSON().substr(11, 8);
  }

  private async sftp(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) { return reject(err); }
        resolve(sftp);
      });
    });
  }
}
