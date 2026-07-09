#!/usr/bin/env node
import { program } from './program.js';
import { db } from '../db/index.js';

process.on('exit', () => db.close());
process.on('SIGINT', () => { db.close(); process.exit(0); });

program.parseAsync(process.argv).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
