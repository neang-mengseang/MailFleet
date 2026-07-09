import { Command } from 'commander';
import fs from 'fs';
import { listMessages, addMessageFile, removeMessageFile, readMessageFile, saveMessageFile, getMessagesDir } from '../core/workspace.js';

export const messagesCommand = new Command('messages')
  .description('Manage email templates in ./mailfleet/messages/');

messagesCommand
  .command('list')
  .description('List all message templates')
  .action(() => {
    const messages = listMessages();
    if (messages.length === 0) {
      console.log(`  No message templates found in ${getMessagesDir()}`);
      console.log('  Add one with: mailfleet messages add <file>');
      return;
    }
    console.log('\n  Message Templates:\n');
    console.log('  Name' + ' '.repeat(24) + 'Preview');
    console.log('  ' + '-'.repeat(80));
    for (const m of messages) {
      console.log(`  ${m.name.padEnd(28)} ${m.preview.slice(0, 50)}`);
    }
    console.log();
  });

messagesCommand
  .command('add <file>')
  .description('Copy a .md file into ./mailfleet/messages/')
  .option('-n, --name <name>', 'Name to save as (without extension)')
  .action((file, opts) => {
    if (!fs.existsSync(file)) {
      console.error(`  File not found: ${file}`);
      process.exit(1);
    }
    const dest = addMessageFile(file, opts.name);
    console.log(`  Message added: ${dest}`);
  });

messagesCommand
  .command('create <name>')
  .description('Create a new message template from scratch')
  .option('-s, --subject <text>', 'Default subject', '')
  .action((name, opts) => {
    const template = `# Hello {{name}}

${opts.subject ? `Subject: ${opts.subject}` : ''}

Write your email here in Markdown. Use {{variable}} for per-recipient substitution.
`;
    const dest = saveMessageFile(name, template);
    console.log(`  Message created: ${dest}`);
    console.log('  Edit the file to write your email.');
  });

messagesCommand
  .command('remove <name>')
  .description('Remove a message template by name')
  .action((name) => {
    const ok = removeMessageFile(name);
    if (ok) console.log(`  Message removed: ${name}`);
    else console.error(`  Message not found: ${name}`);
  });

messagesCommand
  .command('show <name>')
  .description('Show the contents of a message template')
  .action((name) => {
    const content = readMessageFile(name);
    if (!content) {
      console.error(`  Message not found: ${name}`);
      process.exit(1);
    }
    console.log(content);
  });

messagesCommand
  .command('path')
  .description('Show the messages directory path')
  .action(() => {
    console.log(getMessagesDir());
  });
