import { Command } from 'commander';
import { listProviders } from '../providers/index.js';

export const providersCommand = new Command('providers')
  .description('List all available email providers and their status')
  .action(() => {
    const providers = listProviders();
    console.log('\n  Available Email Providers:\n');
    for (const p of providers) {
      const status = p.configured ? 'configured' : 'not configured';
      const icon = p.configured ? '\u2713' : '\u2717';
      console.log(`  ${icon} ${p.id.padEnd(12)} ${p.name.padEnd(12)} ${status}`);
      if (!p.configured) {
        console.log(`      Required config: ${p.requiredEnv.join(', ')}`);
      }
    }
    console.log('\n  Configure with: mailfleet config set <KEY> <VALUE>\n');
  });
