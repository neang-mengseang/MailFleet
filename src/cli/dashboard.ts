import { Command } from 'commander';
import { startServer } from '../server/index.js';

export const dashboardCommand = new Command('dashboard')
  .description('Start the web dashboard for viewing history and managing sends')
  .option('-p, --port <port>', 'Port to run on', '3210')
  .option('--no-open', 'Do not open browser automatically')
  .action(async (opts) => {
    const port = parseInt(opts.port, 10);
    await startServer(port, opts.open);
  });
