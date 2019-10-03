import { Client, ConnectConfig } from 'ssh2';

const conn = new Client();

export function connect(config: ConnectConfig): Promise<Client> {
  return new Promise((resolve, reject) => {
    conn
      .on('ready', () => resolve(conn))
      .on('error', err => reject(err))
      .connect(config);
  });
}
