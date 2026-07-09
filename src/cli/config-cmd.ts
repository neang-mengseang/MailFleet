import { Command } from 'commander';
import { getConfig, saveConfig, deleteConfigKeys, clearConfig, getConfigPath } from '../config/index.js';
import { listProviders } from '../providers/index.js';

export const configCommand = new Command('config')
  .description('Manage MailFleet configuration (API keys, defaults)');

configCommand
  .command('set <key> <value>')
  .description('Set a config value (e.g. BREVO_API_KEY xxx)')
  .action((key, value) => {
    saveConfig({ [key]: value });
    console.log(`  Set ${key}`);
  });

configCommand
  .command('get <key>')
  .description('Get a config value')
  .action((key) => {
    const val = (getConfig() as any)[key];
    if (val) console.log(val);
    else console.log(`  ${key} is not set`);
  });

configCommand
  .command('list')
  .description('List all config values (API keys masked)')
  .action(() => {
    const cfg = getConfig();
    const path = getConfigPath();
    console.log(`  Config file: ${path}\n`);
    const entries = Object.entries(cfg);
    if (entries.length === 0) {
      console.log('  No config set. Use: mailfleet config set <KEY> <VALUE>');
      return;
    }
    for (const [key, val] of entries) {
      const isSecret = /key|secret|password/i.test(key);
      const display = isSecret && typeof val === 'string' && val.length > 4
        ? val.slice(0, 4) + '****' + val.slice(-4)
        : val;
      console.log(`  ${key} = ${display}`);
    }
  });

configCommand
  .command('delete <key>')
  .description('Delete a config value')
  .action((key) => {
    deleteConfigKeys([key]);
    console.log(`  Deleted ${key}`);
  });

configCommand
  .command('clear')
  .description('Clear all config')
  .action(() => {
    clearConfig();
    console.log('  Config cleared');
  });

configCommand
  .command('path')
  .description('Show config file path')
  .action(() => {
    console.log(getConfigPath());
  });

configCommand
  .command('providers')
  .description('Show all providers and their configuration status')
  .action(() => {
    const providers = listProviders();
    console.log('\n  Email Providers:\n');
    for (const p of providers) {
      const status = p.configured ? 'configured' : 'not configured';
      const icon = p.configured ? '\u2713' : '\u2717';
      console.log(`  ${icon} ${p.id.padEnd(12)} ${p.name.padEnd(12)} ${status}`);
      if (!p.configured) {
        console.log(`      Required: ${p.requiredEnv.join(', ')}`);
      }
    }
    console.log();
  });
