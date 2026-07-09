import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const WORKSPACE_DIR = path.join(process.cwd(), 'mailfleet');
const CONTACTS_DIR = path.join(WORKSPACE_DIR, 'contacts');
const MESSAGES_DIR = path.join(WORKSPACE_DIR, 'messages');

export interface ContactFile {
  name: string;
  filename: string;
  path: string;
  count: number;
  size: number;
}

export interface MessageFile {
  name: string;
  filename: string;
  path: string;
  size: number;
  preview: string;
}

export function initWorkspace(): void {
  fs.mkdirSync(CONTACTS_DIR, { recursive: true });
  fs.mkdirSync(MESSAGES_DIR, { recursive: true });
}

export function getWorkspacePath(): string {
  return WORKSPACE_DIR;
}

export function getContactsDir(): string {
  return CONTACTS_DIR;
}

export function getMessagesDir(): string {
  return MESSAGES_DIR;
}

export function listContacts(): ContactFile[] {
  initWorkspace();
  const files = fs.readdirSync(CONTACTS_DIR).filter(f => /\.(csv|json|txt|xlsx|xls)$/i.test(f));
  return files.map(filename => {
    const filePath = path.join(CONTACTS_DIR, filename);
    const stat = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();
    let count = 0;
    if (ext === '.xlsx' || ext === '.xls') {
      count = countExcelRecipients(filePath);
    } else {
      const content = fs.readFileSync(filePath, 'utf-8');
      count = countRecipients(content, ext);
    }
    return {
      name: path.basename(filename, path.extname(filename)),
      filename,
      path: filePath,
      count,
      size: stat.size,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function listMessages(): MessageFile[] {
  initWorkspace();
  const files = fs.readdirSync(MESSAGES_DIR).filter(f => /\.md$/i.test(f));
  return files.map(filename => {
    const filePath = path.join(MESSAGES_DIR, filename);
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const preview = content.slice(0, 100).replace(/\n/g, ' ');
    return {
      name: path.basename(filename, path.extname(filename)),
      filename,
      path: filePath,
      size: stat.size,
      preview,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveContactFile(name: string): string | null {
  initWorkspace();
  const exts = ['.csv', '.json', '.txt', '.xlsx', '.xls'];
  for (const ext of exts) {
    const candidate = path.join(CONTACTS_DIR, name + ext);
    if (fs.existsSync(candidate)) return candidate;
  }
  if (fs.existsSync(name) && /\.(csv|json|txt|xlsx|xls)$/i.test(name)) return name;
  return null;
}

export function resolveMessageFile(name: string): string | null {
  initWorkspace();
  const candidate = path.join(MESSAGES_DIR, name + '.md');
  if (fs.existsSync(candidate)) return candidate;
  if (fs.existsSync(name) && /\.md$/i.test(name)) return name;
  return null;
}

export function addContactFile(sourcePath: string, name?: string): string {
  initWorkspace();
  const ext = path.extname(sourcePath);
  const baseName = name ?? path.basename(sourcePath, ext);
  const dest = path.join(CONTACTS_DIR, baseName + ext);
  fs.copyFileSync(sourcePath, dest);
  return dest;
}

export function addMessageFile(sourcePath: string, name?: string): string {
  initWorkspace();
  const baseName = name ?? path.basename(sourcePath, '.md');
  const dest = path.join(MESSAGES_DIR, baseName + '.md');
  fs.copyFileSync(sourcePath, dest);
  return dest;
}

export function removeContactFile(name: string): boolean {
  const file = resolveContactFile(name);
  if (!file) return false;
  fs.unlinkSync(file);
  return true;
}

export function removeMessageFile(name: string): boolean {
  const file = resolveMessageFile(name);
  if (!file) return false;
  fs.unlinkSync(file);
  return true;
}

export function saveMessageFile(name: string, content: string): string {
  initWorkspace();
  const dest = path.join(MESSAGES_DIR, name + '.md');
  fs.writeFileSync(dest, content, 'utf-8');
  return dest;
}

export function saveContactFile(name: string, content: string, ext: string): string {
  initWorkspace();
  const dest = path.join(CONTACTS_DIR, name + ext);
  fs.writeFileSync(dest, content, 'utf-8');
  return dest;
}

export function readMessageFile(name: string): string | null {
  const file = resolveMessageFile(name);
  if (!file) return null;
  return fs.readFileSync(file, 'utf-8');
}

export function readContactFile(name: string): string | null {
  const file = resolveContactFile(name);
  if (!file) return null;
  const ext = path.extname(file).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    const buf = fs.readFileSync(file);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    return XLSX.utils.sheet_to_csv(sheet);
  }
  return fs.readFileSync(file, 'utf-8');
}

function countRecipients(content: string, ext: string): number {
  const lower = ext.toLowerCase();
  if (lower === '.json') {
    try {
      const data = JSON.parse(content);
      return Array.isArray(data) ? data.length : 1;
    } catch {
      return 0;
    }
  }
  if (lower === '.csv') {
    const lines = content.trim().split(/\r?\n/).filter(l => l.trim());
    return Math.max(0, lines.length - 1);
  }
  if (lower === '.txt') {
    return content.trim().split(/\r?\n/).filter(l => l.trim() && !l.startsWith('#')).length;
  }
  return 0;
}

function countExcelRecipients(filePath: string): number {
  try {
    const buf = fs.readFileSync(filePath);
    const wb = XLSX.read(buf, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    return rows.length;
  } catch {
    return 0;
  }
}
