import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { parseRecipients } from '../core/recipients.js';
import { bulkSend } from '../core/sender.js';
import { getConfig } from '../config/index.js';
import { listProviders } from '../providers/index.js';
import { resolveMessageFile, resolveContactFile } from '../core/workspace.js';

export const sendCommand = new Command('send')
  .description('Send bulk emails from a markdown template to a list of recipients')
  .requiredOption('-m, --message <file>', 'Markdown file with the email body')
  .requiredOption('-r, --recipients <file>', 'CSV or JSON file with recipient list')
  .requiredOption('-s, --subject <text>', 'Email subject (supports {{variables}})')
  .option('-p, --provider <id>', 'Email provider to use', getConfig().DEFAULT_PROVIDER ?? 'brevo')
  .option('-f, --from <email>', 'From email address', getConfig().DEFAULT_FROM_EMAIL)
  .option('-n, --from-name <name>', 'From display name', getConfig().DEFAULT_FROM_NAME)
  .option('--reply-to <email>', 'Reply-to email address')
  .option('--batch-size <n>', 'Batch size for sending', '50')
  .option('--delay <ms>', 'Delay between batches in ms', '100')
  .option('--tag <tag...>', 'Tags to attach to emails')
  .option('--dry-run', 'Simulate sending without actually sending')
  .option('--no-progress', 'Hide progress output')
  .action(async (opts) => {
    const messageFile = resolveMessageFile(opts.message);
    if (!messageFile) {
      console.error(`Message not found: ${opts.message}`);
      console.error('  Looked in ./mailfleet/messages/ and as a direct file path.');
      process.exit(1);
    }
    const recipientsFile = resolveContactFile(opts.recipients);
    if (!recipientsFile) {
      console.error(`Recipients not found: ${opts.recipients}`);
      console.error('  Looked in ./mailfleet/contacts/ and as a direct file path.');
      process.exit(1);
    }
    if (!opts.from) {
      console.error('From email is required. Use -f or set DEFAULT_FROM_EMAIL in config.');
      process.exit(1);
    }

    const available = listProviders();
    const providerInfo = available.find(p => p.id === opts.provider);
    if (!providerInfo) {
      console.error(`Unknown provider: ${opts.provider}. Available: ${available.map(p => p.id).join(', ')}`);
      process.exit(1);
    }
    if (!providerInfo.configured && !opts.dryRun) {
      console.error(`Provider "${opts.provider}" is not configured. Run: mailfleet config set`);
      console.error(`Required env: ${providerInfo.requiredEnv.join(', ')}`);
      process.exit(1);
    }

    const recipients = parseRecipients(recipientsFile);
    if (recipients.length === 0) {
      console.error('No recipients found in file.');
      process.exit(1);
    }

    console.log(`\n  Provider:  ${opts.provider}`);
    console.log(`  Recipients: ${recipients.length}`);
    console.log(`  Subject:   ${opts.subject}`);
    console.log(`  From:      ${opts.fromName ? `${opts.fromName} <${opts.from}>` : opts.from}`);
    console.log(`  Template:  ${messageFile}`);
    if (opts.dryRun) console.log(`  Mode:      DRY RUN (no emails will be sent)`);
    console.log('');

    const batchSize = parseInt(opts.batchSize, 10);
    const delayMs = parseInt(opts.delay, 10);

    const summary = await bulkSend({
      provider: opts.provider,
      mdFile: messageFile,
      subject: opts.subject,
      recipients,
      fromEmail: opts.from,
      fromName: opts.fromName,
      replyTo: opts.replyTo,
      batchSize,
      delayMs,
      tags: opts.tag,
      dryRun: opts.dryRun,
      onProgress: opts.progress ? (current, total, recipient, result) => {
        const status = result.success ? 'OK' : 'FAIL';
        const icon = result.success ? '\u2713' : '\u2717';
        process.stdout.write(`  [${current}/${total}] ${icon} ${recipient.email} ${result.error ? '- ' + result.error : ''}\n`);
      } : undefined,
    });

    console.log(`\n  Sent: ${summary.sent}  Failed: ${summary.failed}  Total: ${summary.total}\n`);
    if (summary.failed > 0 && !opts.dryRun) {
      console.log('  Failed recipients:');
      summary.results.filter(r => !r.result.success).forEach(r => {
        console.log(`    ${r.recipient.email}: ${r.result.error}`);
      });
      console.log();
    }
  });
