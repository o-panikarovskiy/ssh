import { readFileSync } from 'fs';
import { startShell } from './client-shell';
import { commands } from './commands';
import { connect } from './connect';

main(process.argv);

async function main(args: string[]) {
  console.log(args);

  const client = await connect({
    host: '206.189.56.128',
    port: 9760,
    username: 'oleg',
    privateKey: readFileSync('/Users/opnk/.ssh/id_rsa'),
  });

  await startShell(client, commands);
}
