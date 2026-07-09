import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import os from 'os';
import fs from 'fs';

const DB_DIR = path.join(os.homedir(), '.mailfleet');
const DB_PATH = path.join(DB_DIR, 'mailfleet.db');

fs.mkdirSync(DB_DIR, { recursive: true });

const sqlite = new DatabaseSync(DB_PATH);
sqlite.exec('PRAGMA journal_mode = WAL;');

sqlite.exec(`
CREATE TABLE IF NOT EXISTS batches (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  subject TEXT NOT NULL,
  md_file TEXT NOT NULL,
  from_email TEXT NOT NULL,
  from_name TEXT DEFAULT '',
  total INTEGER DEFAULT 0,
  sent INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  tags TEXT DEFAULT '',
  status TEXT DEFAULT 'running',
  created_at TEXT DEFAULT (datetime('now')),
  finished_at TEXT
);

CREATE TABLE IF NOT EXISTS sends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT DEFAULT '',
  subject TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  message_id TEXT DEFAULT '',
  error TEXT DEFAULT '',
  provider TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (batch_id) REFERENCES batches(id)
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  md_content TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sends_batch ON sends(batch_id);
CREATE INDEX IF NOT EXISTS idx_sends_email ON sends(recipient_email);
CREATE INDEX IF NOT EXISTS idx_batches_created ON batches(created_at DESC);
`);

export interface BatchRow {
  id: string;
  provider: string;
  subject: string;
  md_file: string;
  from_email: string;
  from_name: string;
  total: number;
  sent: number;
  failed: number;
  tags: string;
  status: string;
  created_at: string;
  finished_at: string | null;
}

export interface SendRow {
  id: number;
  batch_id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  success: number;
  message_id: string;
  error: string;
  provider: string;
  created_at: string;
}

export interface TemplateRow {
  id: number;
  name: string;
  subject: string;
  md_content: string;
  created_at: string;
  updated_at: string;
}

function all<T>(stmt: ReturnType<typeof sqlite.prepare>, ...params: any[]): T[] {
  return stmt.all(...params) as T[];
}

function get<T>(stmt: ReturnType<typeof sqlite.prepare>, ...params: any[]): T | null {
  const row = stmt.get(...params);
  return (row ?? null) as T | null;
}

export const db = {
  createBatch(b: { provider: string; subject: string; md_file: string; from_email: string; from_name: string; total: number; tags: string }): string {
    const id = `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    sqlite.prepare(
      `INSERT INTO batches (id, provider, subject, md_file, from_email, from_name, total, tags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'running')`
    ).run(id, b.provider, b.subject, b.md_file, b.from_email, b.from_name, b.total, b.tags);
    return id;
  },

  finishBatch(id: string, sent: number, failed: number): void {
    sqlite.prepare(
      `UPDATE batches SET sent = ?, failed = ?, status = 'completed', finished_at = datetime('now') WHERE id = ?`
    ).run(sent, failed, id);
  },

  logSend(s: { batch_id: string; recipient_email: string; recipient_name: string; subject: string; success: number; message_id: string; error: string; provider: string }): void {
    sqlite.prepare(
      `INSERT INTO sends (batch_id, recipient_email, recipient_name, subject, success, message_id, error, provider)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(s.batch_id, s.recipient_email, s.recipient_name, s.subject, s.success, s.message_id, s.error, s.provider);
  },

  getBatches(limit = 50): BatchRow[] {
    return all<BatchRow>(sqlite.prepare(`SELECT * FROM batches ORDER BY created_at DESC LIMIT ?`), limit);
  },

  getBatch(id: string): BatchRow | null {
    return get<BatchRow>(sqlite.prepare(`SELECT * FROM batches WHERE id = ?`), id);
  },

  getSendsByBatch(batchId: string): SendRow[] {
    return all<SendRow>(sqlite.prepare(`SELECT * FROM sends WHERE batch_id = ? ORDER BY id ASC`), batchId);
  },

  getAllSends(limit = 100, offset = 0): SendRow[] {
    return all<SendRow>(sqlite.prepare(`SELECT * FROM sends ORDER BY created_at DESC LIMIT ? OFFSET ?`), limit, offset);
  },

  getStats(): { total_batches: number; total_sent: number; total_failed: number; total_recipients: number } {
    return get<any>(sqlite.prepare(
      `SELECT
        COUNT(DISTINCT b.id) as total_batches,
        COALESCE(SUM(b.sent), 0) as total_sent,
        COALESCE(SUM(b.failed), 0) as total_failed,
        COALESCE(SUM(b.total), 0) as total_recipients
       FROM batches b`
    )) ?? { total_batches: 0, total_sent: 0, total_failed: 0, total_recipients: 0 };
  },

  saveTemplate(name: string, subject: string, mdContent: string): void {
    sqlite.prepare(
      `INSERT INTO templates (name, subject, md_content) VALUES (?, ?, ?)
       ON CONFLICT(name) DO UPDATE SET subject = excluded.subject, md_content = excluded.md_content, updated_at = datetime('now')`
    ).run(name, subject, mdContent);
  },

  getTemplates(): TemplateRow[] {
    return all<TemplateRow>(sqlite.prepare(`SELECT * FROM templates ORDER BY updated_at DESC`));
  },

  getTemplate(name: string): TemplateRow | null {
    return get<TemplateRow>(sqlite.prepare(`SELECT * FROM templates WHERE name = ?`), name);
  },

  deleteTemplate(name: string): void {
    sqlite.prepare(`DELETE FROM templates WHERE name = ?`).run(name);
  },

  close(): void {
    sqlite.close();
  },
};
