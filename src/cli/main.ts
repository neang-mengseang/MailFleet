#!/usr/bin/env node
import { program } from './program.js';
import { db } from '../db/index.js';

let isShuttingDown = false;

const shutdown = () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  db.close();
};

process.on('exit', shutdown);
process.on('SIGINT', () => { shutdown(); process.exit(0); });

program.parseAsync(process.argv).catch(err => {
  console.error('Error:', err.message);
  shutdown();
  process.exit(1);
});
