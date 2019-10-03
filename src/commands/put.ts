import * as path from 'path';
import { Client, SFTPWrapper } from 'ssh2';
import { ICommand, ICommandOptions } from './command';

export default function create() {
  return new PutCommand();
}

class PutCommand implements ICommand {
  public canRun(commandName: string) {
    return commandName === 'put';
  }

  public async run(options: ICommandOptions) {
    const { client, args } = options;

    if (!args[0]) { throw new Error('No such file'); }

    const filePath = args[0].trim();
    const localPath = this.getLocalPath(filePath);
    const remotePath = path.basename(filePath);

    process.stdout.write(`\n[${this.getTime()}] Uploading from 127.0.0.1:${localPath} to ${remotePath}`);
    await this.task(client, remotePath, localPath);
    process.stdout.write(`\n[${this.getTime()}] File is uploaded successfully`);
  }

  private getLocalPath(filePath: string) {
    if (filePath.startsWith('./')) {
      return path.join(path.dirname(process.argv[1]), filePath);
    }
    return filePath;
  }

  private async task(client: Client, remotePath: string, localPath: string) {
    const sftp = await this.sftp(client);

    return new Promise((resolve, reject) => {
      sftp.fastPut(localPath, remotePath, err => {
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
