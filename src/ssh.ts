import { connect } from './connect';
import { parseArgs } from './parse-args';
import { startShell } from './shell/client-shell';
import { commands } from './shell/commands';
import { tunnel } from './tunnel';

main(process.argv.slice(2));

async function main(args: string[]) {
  try {
    const config = parseArgs(args);

    const client = await connect(config);

    if (config.L || config.R) {
      tunnel(args);
    } else {
      await startShell(client, commands);
    }

  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}
