import { Command } from 'commander';
import { db } from '../db/index.js';

export const historyCommand = new Command('history')
  .description('View sending history');

historyCommand
  .command('batches')
  .description('List recent send batches')
  .option('-l, --limit <n>', 'Number of batches to show', '20')
  .action((opts) => {
    const limit = parseInt(opts.limit, 10);
    const batches = db.getBatches(limit);
    if (batches.length === 0) {
      console.log('  No batches found.');
      return;
    }
    console.log('\n  Recent Batches:\n');
    console.log('  Date                Provider     Sent/Total   Status     Subject');
    console.log('  ' + '-'.repeat(90));
    for (const b of batches) {
      const date = b.created_at.replace('T', ' ').slice(0, 19);
      const ratio = `${b.sent}/${b.total}`;
      console.log(`  ${date}  ${b.provider.padEnd(12)} ${ratio.padEnd(12)} ${b.status.padEnd(10)} ${b.subject.slice(0, 40)}`);
    }
    console.log();
  });

historyCommand
  .command('batch <id>')
  .description('Show details of a specific batch')
  .action((id) => {
    const batch = db.getBatch(id);
    if (!batch) {
      console.error(`  Batch not found: ${id}`);
      process.exit(1);
    }
    const sends = db.getSendsByBatch(id);
    console.log(`\n  Batch: ${batch.id}`);
    console.log(`  Provider: ${batch.provider}`);
    console.log(`  Subject: ${batch.subject}`);
    console.log(`  From: ${batch.from_name ? batch.from_name + ' ' : ''}<${batch.from_email}>`);
    console.log(`  Template: ${batch.md_file}`);
    console.log(`  Status: ${batch.status}`);
    console.log(`  Sent: ${batch.sent}  Failed: ${batch.failed}  Total: ${batch.total}`);
    console.log(`  Created: ${batch.created_at}`);
    if (batch.finished_at) console.log(`  Finished: ${batch.finished_at}`);
    console.log(`\n  Recipients:\n`);
    for (const s of sends) {
      const icon = s.success ? '\u2713' : '\u2717';
      console.log(`  ${icon} ${s.recipient_email.padEnd(35)} ${s.error ? '- ' + s.error : ''}`);
    }
    console.log();
  });

historyCommand
  .command('stats')
  .description('Show overall sending statistics')
  .action(() => {
    const stats = db.getStats();
    console.log('\n  MailFleet Statistics:\n');
    console.log(`  Total batches:    ${stats.total_batches}`);
    console.log(`  Total sent:       ${stats.total_sent}`);
    console.log(`  Total failed:     ${stats.total_failed}`);
    console.log(`  Total recipients: ${stats.total_recipients}`);
    console.log();
  });
