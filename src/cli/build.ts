import { Command } from 'commander';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';

export const buildCommand = new Command('build')
  .description('Build MailFleet CLI and web dashboard')
  .option('-w, --web-only', 'Build only the web dashboard')
  .option('-c, --cli-only', 'Build only the CLI')
  .action(async (options) => {
    try {
      const rootDir = path.resolve();
      
      if (options.webOnly) {
        console.log('Building web dashboard...');
        execSync('cd web && npm run build', { cwd: rootDir, stdio: 'inherit' });
        console.log('✓ Web dashboard built successfully');
      } else if (options.cliOnly) {
        console.log('Building CLI...');
        execSync('tsc', { cwd: rootDir, stdio: 'inherit' });
        console.log('✓ CLI built successfully');
      } else {
        console.log('Building MailFleet...');
        console.log('Building CLI...');
        execSync('tsc', { cwd: rootDir, stdio: 'inherit' });
        console.log('✓ CLI built successfully');
        
        console.log('Building web dashboard...');
        execSync('cd web && npm run build', { cwd: rootDir, stdio: 'inherit' });
        console.log('✓ Web dashboard built successfully');
        
        console.log('\n✓ MailFleet built successfully!');
        console.log('Run: node dist/cli/index.js dashboard');
      }
    } catch (error: any) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });