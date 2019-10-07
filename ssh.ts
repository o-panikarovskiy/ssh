import { connect } from './src/connect';
import { parseArgs } from './src/parse-args';
import { startShell } from './src/shell/client-shell';
import { commands } from './src/shell/commands';
import { tunnel } from './src/tunnel';

main(process.argv.slice(2));

async function main(args: string[]) {
  try {
    const config = parseArgs(args);

    if (config.L || config.R) {
      tunnel(args);
    } else {
      const client = await connect(config);
      await startShell(client, commands);
    }

  } catch (error) {
    console.error(error.message || error);
    process.exit(1);
  }
}
