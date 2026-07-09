#!/usr/bin/env node
process.removeAllListeners('warning');
process.emitWarning = () => process;
import('./main.js');
