import * as path from 'path';
import { Client, SFTPWrapper } from 'ssh2';
import { ICommand, ICommandOptions } from './command';

export default function create() {
  return new GetCommand();
}

class GetCommand implements ICommand {
  public readonly name = 'get';
  private sftp: SFTPWrapper;

  public async run(options: ICommandOptions) {
    const { client, args } = options;

    if (!args[0]) { throw new Error('No such file'); }

    const remotePath = args[0].trim();
    const localPath = path.join(path.dirname(process.argv[1]), path.basename(remotePath));

    process.stdout.write(`\n[${this.getTime()}] Downloading from ${remotePath} to 127.0.0.1:${localPath}`);
    await this.task(client, remotePath, localPath);
    process.stdout.write(`\n[${this.getTime()}] File is downloaded successfully`);
  }

  private async task(client: Client, remotePath: string, localPath: string) {
    if (!this.sftp) { this.sftp = await this.getSftp(client); }

    const realpath = await this.getRealPath(remotePath);

    return new Promise((resolve, reject) => {
      this.sftp.fastGet(realpath, localPath, err => {
        if (err) { return reject(err); }
        resolve();
      });
    });
  }

  private getTime() {
    return (new Date()).toJSON().substr(11, 8);
  }

  private async getSftp(client: Client): Promise<SFTPWrapper> {
    return new Promise((resolve, reject) => {
      client.sftp((err, sftp) => {
        if (err) { return reject(err); }
        resolve(sftp);
      });
    });
  }

  private async getRealPath(relPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.sftp.realpath(relPath, (err, rp) => {
        if (err) { return reject(err); }
        resolve(rp);
      });
    });
  }
}
