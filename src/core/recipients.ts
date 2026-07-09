import fs from 'fs';
import path from 'path';
import { parse as parseCsv } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

export interface Recipient {
  email: string;
  name?: string;
  data: Record<string, any>;
}

export function parseRecipients(filePath: string): Recipient[] {
  const ext = path.extname(filePath).toLowerCase();
  const raw = fs.readFileSync(filePath);

  if (ext === '.json') {
    return parseJson(raw.toString('utf-8'));
  }
  if (ext === '.csv') {
    return parseCsvString(raw.toString('utf-8'));
  }
  if (ext === '.txt') {
    return parseTxt(raw.toString('utf-8'));
  }
  if (ext === '.xlsx' || ext === '.xls') {
    return parseExcel(raw);
  }
  throw new Error(`Unsupported recipients file format: ${ext}. Use .xlsx, .xls, .csv, .json, or .txt`);
}

function parseJson(raw: string): Recipient[] {
  const data = JSON.parse(raw);
  const arr = Array.isArray(data) ? data : [data];
  return arr.map((item: any, i: number) => {
    const email = item.email ?? item.Email ?? item.E;
    if (!email) throw new Error(`Recipient #${i}: missing "email" field`);
    const { email: _e, Email: _E, name: _n, Name: _N, ...rest } = item;
    const name = item.name ?? item.Name;
    return {
      email: String(email),
      name: name || String(email).split('@')[0],
      data: { ...item, name: name || String(email).split('@')[0] },
    };
  });
}

function parseCsvString(raw: string): Recipient[] {
  const records: Record<string, string>[] = parseCsv(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((row, i) => {
    const email = row.email ?? row.Email ?? row.E ?? row.EMAIL;
    if (!email) throw new Error(`CSV row #${i + 1}: missing "email" column`);
    const name = row.name ?? row.Name;
    return {
      email,
      name: name || email.split('@')[0],
      data: { ...row, name: name || email.split('@')[0] },
    };
  });
}

function parseTxt(raw: string): Recipient[] {
  return raw
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'))
    .map(email => ({ email, name: email.split('@')[0], data: { email, name: email.split('@')[0] } }));
}

function parseExcel(raw: Buffer): Recipient[] {
  const workbook = XLSX.read(raw, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Excel file has no sheets');
  const sheet = workbook.Sheets[sheetName];
  const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return rows.map((row, i) => {
    const email = row.email ?? row.Email ?? row.E ?? row.EMAIL;
    if (!email) throw new Error(`Excel row #${i + 2}: missing "email" column`);
    const name = row.name ?? row.Name;
    return {
      email: String(email).trim(),
      name: (name || String(email).split('@')[0]).trim(),
      data: { ...row, name: (name || String(email).split('@')[0]).trim() },
    };
  });
}
