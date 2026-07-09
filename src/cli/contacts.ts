import { Command } from 'commander';
import fs from 'fs';
import { listContacts, addContactFile, removeContactFile, readContactFile, getContactsDir } from '../core/workspace.js';

export const contactsCommand = new Command('contacts')
  .description('Manage contact lists in ./mailfleet/contacts/');

contactsCommand
  .command('list')
  .description('List all contact files')
  .action(() => {
    const contacts = listContacts();
    if (contacts.length === 0) {
      console.log(`  No contact files found in ${getContactsDir()}`);
      console.log('  Add one with: mailfleet contacts add <file>');
      return;
    }
    console.log('\n  Contact Lists:\n');
    console.log('  Name' + ' '.repeat(20) + 'Recipients' + ' '.repeat(6) + 'File');
    console.log('  ' + '-'.repeat(70));
    for (const c of contacts) {
      console.log(`  ${c.name.padEnd(24)} ${String(c.count).padEnd(16)} ${c.filename}`);
    }
    console.log();
  })
;

contactsCommand
  .command('add <file>')
  .description('Copy a CSV/JSON/TXT/Excel file into ./mailfleet/contacts/')
  .option('-n, --name <name>', 'Name to save as (without extension)')
  .action((file, opts) => {
    if (!fs.existsSync(file)) {
      console.error(`  File not found: ${file}`);
      process.exit(1);
    }
    const dest = addContactFile(file, opts.name);
    console.log(`  Contact added: ${dest}`);
  });

contactsCommand
  .command('remove <name>')
  .description('Remove a contact file by name')
  .action((name) => {
    const ok = removeContactFile(name);
    if (ok) console.log(`  Contact removed: ${name}`);
    else console.error(`  Contact not found: ${name}`);
  });

contactsCommand
  .command('show <name>')
  .description('Show the contents of a contact file')
  .action((name) => {
    const content = readContactFile(name);
    if (!content) {
      console.error(`  Contact not found: ${name}`);
      process.exit(1);
    }
    console.log(content);
  });

contactsCommand
  .command('path')
  .description('Show the contacts directory path')
  .action(() => {
    console.log(getContactsDir());
  });
