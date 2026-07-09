import { Command } from 'commander';
import fs from 'fs';
import { parseRecipients } from '../core/recipients.js';
import { previewInBrowser, previewToFile, generatePreviewHtml } from '../core/preview.js';
import { resolveMessageFile, resolveContactFile } from '../core/workspace.js';

export const previewCommand = new Command('preview')
  .description('Preview a rendered email in the browser or save to file')
  .requiredOption('-m, --message <file>', 'Markdown file with the email body')
  .requiredOption('-s, --subject <text>', 'Email subject (supports {{variables}})')
  .option('-r, --recipients <file>', 'CSV/JSON file with recipients (uses first recipient for preview)')
  .option('-o, --output <file>', 'Save preview HTML to file instead of opening browser')
  .option('--print', 'Print rendered HTML to stdout')
  .action(async (opts) => {
    const messageFile = resolveMessageFile(opts.message);
    if (!messageFile) {
      console.error(`Message not found: ${opts.message}`);
      console.error('  Looked in ./mailfleet/messages/ and as a direct file path.');
      process.exit(1);
    }

    let recipient;
    if (opts.recipients) {
      const recipientsFile = resolveContactFile(opts.recipients);
      if (!recipientsFile) {
        console.error(`Recipients not found: ${opts.recipients}`);
        console.error('  Looked in ./mailfleet/contacts/ and as a direct file path.');
        process.exit(1);
      }
      const recipients = parseRecipients(recipientsFile);
      if (recipients.length > 0) {
        recipient = recipients[0];
        console.log(`  Previewing with first recipient: ${recipient.email}`);
      }
    }

    if (opts.print) {
      const html = generatePreviewHtml({
        mdFile: messageFile,
        subject: opts.subject,
        recipient,
      });
      process.stdout.write(html);
      return;
    }

    if (opts.output) {
      const file = previewToFile({ mdFile: messageFile, subject: opts.subject, recipient }, opts.output);
      console.log(`  Preview saved to: ${file}`);
      return;
    }

    const file = await previewInBrowser({ mdFile: messageFile, subject: opts.subject, recipient });
    console.log(`  Preview opened in browser: ${file}`);
  });
