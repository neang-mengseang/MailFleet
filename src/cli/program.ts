import { Command } from 'commander';
import { sendCommand } from './send.js';
import { previewCommand } from './preview.js';
import { configCommand } from './config-cmd.js';
import { dashboardCommand } from './dashboard.js';
import { historyCommand } from './history.js';
import { providersCommand } from './providers-cmd.js';
import { templateCommand } from './template.js';
import { contactsCommand } from './contacts.js';
import { messagesCommand } from './messages.js';

export const program = new Command();

program
  .name('mailfleet')
  .description('Bulk email CLI with multi-provider support, markdown templates, and web dashboard.')
  .version('1.0.0');

program.addCommand(sendCommand);
program.addCommand(previewCommand);
program.addCommand(configCommand);
program.addCommand(dashboardCommand);
program.addCommand(historyCommand);
program.addCommand(providersCommand);
program.addCommand(templateCommand);
program.addCommand(contactsCommand);
program.addCommand(messagesCommand);
