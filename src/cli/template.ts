import { Command } from 'commander';
import fs from 'fs';
import { db } from '../db/index.js';

export const templateCommand = new Command('template')
  .description('Manage saved email templates');

templateCommand
  .command('save <name>')
  .description('Save a markdown file as a named template')
  .requiredOption('-m, --message <file>', 'Markdown file')
  .requiredOption('-s, --subject <text>', 'Email subject')
  .action((name, opts) => {
    if (!fs.existsSync(opts.message)) {
      console.error(`File not found: ${opts.message}`);
      process.exit(1);
    }
    const md = fs.readFileSync(opts.message, 'utf-8');
    db.saveTemplate(name, opts.subject, md);
    console.log(`  Template saved: ${name}`);
  });

templateCommand
  .command('list')
  .description('List all saved templates')
  .action(() => {
    const templates = db.getTemplates();
    if (templates.length === 0) {
      console.log('  No templates saved. Use: mailfleet template save <name> -m <file> -s <subject>');
      return;
    }
    console.log('\n  Saved Templates:\n');
    for (const t of templates) {
      console.log(`  ${t.name.padEnd(25)} ${t.subject.slice(0, 40).padEnd(42)} ${t.updated_at}`);
    }
    console.log();
  });

templateCommand
  .command('show <name>')
  .description('Show a saved template')
  .action((name) => {
    const t = db.getTemplate(name);
    if (!t) {
      console.error(`  Template not found: ${name}`);
      process.exit(1);
    }
    console.log(`\n  Name: ${t.name}`);
    console.log(`  Subject: ${t.subject}`);
    console.log(`  Updated: ${t.updated_at}`);
    console.log(`\n  --- Markdown ---\n`);
    console.log(t.md_content);
    console.log(`\n  --- End ---\n`);
  });

templateCommand
  .command('delete <name>')
  .description('Delete a saved template')
  .action((name) => {
    db.deleteTemplate(name);
    console.log(`  Template deleted: ${name}`);
  });
