import { readFileSync } from 'fs';

export interface IConfig {
  host: string;
  user?: string;
  password?: string;
  privateKey?: string;
  port?: number;
  L?: boolean;
  R?: boolean;
}

export function parseArgs(args: string[]): IConfig {
  let res: Partial<IConfig> = {};

  for (let i = 0, len = args.length; i < len; i += 2) {
    const arg = args[i];
    const value = args[i + 1];

    if (arg === '-p') {
      res.port = Number.parseInt(value, 10);
    } else if (arg === '-i') {
      res.privateKey = readFileSync(value).toString('utf8');
    } else if (arg === '-L') {
      res.L = true;
    } else if (arg === '-R') {
      res.R = true;
    } else {
      i--;
      const splits = arg.split('@');
      const [user, password] = splits[0].split(':');
      const host = splits[1];
      res = { ...res, user, password, host };
    }
  }

  if (!res.host) { throw new TypeError('Host not defined.'); }

  return res as IConfig;
}
