import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import { db } from '../db/index.js';
import { listProviders } from '../providers/index.js';
import { getConfig, saveConfig } from '../config/index.js';
import { renderMarkdown, wrapHtml } from '../core/renderer.js';
import { renderTemplate } from '../core/templater.js';
import { bulkSend } from '../core/sender.js';
import { parseRecipients } from '../core/recipients.js';
import {
  listContacts, listMessages, addContactFile, addMessageFile,
  removeContactFile, removeMessageFile, readMessageFile, readContactFile,
  saveMessageFile, saveContactFile, resolveMessageFile, resolveContactFile,
} from '../core/workspace.js';
import { getStorageAdapter, listStorageAdapters } from '../storage/index.js';
import { applyTemplate, TEMPLATES, TemplateId } from '../core/templates.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function startServer(port: number, openBrowser: boolean): Promise<void> {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  const webDist = path.join(__dirname, '../../web/dist');
  const hasWebBuild = fs.existsSync(webDist);

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
  });

  app.get('/api/stats', (_req, res) => {
    res.json(db.getStats());
  });

  app.get('/api/providers', (_req, res) => {
    res.json(listProviders());
  });

  app.get('/api/config', (_req, res) => {
    const cfg = getConfig();
    const masked: Record<string, any> = {};
    for (const [key, val] of Object.entries(cfg)) {
      const isSecret = /key|secret|password/i.test(key);
      masked[key] = isSecret && typeof val === 'string' && val.length > 4
        ? val.slice(0, 4) + '****' + val.slice(-4)
        : val;
    }
    res.json(masked);
  });

  app.post('/api/config', (req, res) => {
    saveConfig(req.body);
    res.json({ success: true });
  });

  app.get('/api/batches', (_req, res) => {
    res.json(db.getBatches(100));
  });

  app.get('/api/batches/:id', (req, res) => {
    const batch = db.getBatch(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });
    const sends = db.getSendsByBatch(req.params.id);
    res.json({ batch, sends });
  });

  app.get('/api/sends', (req, res) => {
    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;
    res.json(db.getAllSends(limit, offset));
  });

  app.get('/api/templates', (_req, res) => {
    res.json(db.getTemplates());
  });

  app.post('/api/templates', (req, res) => {
    const { name, subject, mdContent } = req.body;
    if (!name || !subject || !mdContent) {
      return res.status(400).json({ error: 'name, subject, mdContent required' });
    }
    db.saveTemplate(name, subject, mdContent);
    res.json({ success: true });
  });

  app.delete('/api/templates/:name', (req, res) => {
    db.deleteTemplate(req.params.name);
    res.json({ success: true });
  });

  app.post('/api/preview', (req, res) => {
    const { mdContent, htmlContent, subject, data, templateId } = req.body;
    if ((!mdContent && !htmlContent) || !subject) {
      return res.status(400).json({ error: 'mdContent or htmlContent and subject required' });
    }
    const renderedSubject = renderTemplate(subject, data ?? {});
    if (htmlContent) {
      let html = renderTemplate(htmlContent, data ?? {});
      if (templateId) html = applyTemplate(html, templateId as TemplateId);
      res.json({ html: wrapHtml(html, renderedSubject) });
    } else {
      const renderedMd = renderTemplate(mdContent, data ?? {});
      let html = renderMarkdown(renderedMd);
      if (templateId) html = applyTemplate(html, templateId as TemplateId);
      res.json({ html: wrapHtml(html, renderedSubject) });
    }
  });

  app.post('/api/send', async (req, res) => {
    try {
      const { provider, htmlContent, mdContent, subject, recipients, contactList, fromEmail, fromName, replyTo, tags, batchSize, delayMs, dryRun, attachments, templateId } = req.body;
      if (!provider || (!mdContent && !htmlContent) || !subject || (!recipients && !contactList) || !fromEmail) {
        return res.status(400).json({ error: 'provider, mdContent or htmlContent, subject, recipients or contactList, fromEmail required' });
      }

      const tmpMd = path.join(os.tmpdir(), `mailfleet-send-${Date.now()}.md`);
      let contentToWrite = htmlContent ?? mdContent;
      if (templateId && templateId !== 'none') {
        contentToWrite = applyTemplate(contentToWrite, templateId as TemplateId);
      }
      fs.writeFileSync(tmpMd, contentToWrite, 'utf-8');

      let recipientList;
      if (contactList) {
        const file = resolveContactFile(contactList);
        if (!file) return res.status(400).json({ error: `Contact list not found: ${contactList}` });
        recipientList = parseRecipients(file);
      } else if (Array.isArray(recipients)) {
        recipientList = recipients.map((r: any) => ({ email: r.email, name: r.name, data: r }));
      } else {
        recipientList = parseRecipients(recipients);
      }

      const summary = await bulkSend({
        provider,
        mdFile: tmpMd,
        subject,
        recipients: recipientList,
        fromEmail,
        fromName,
        replyTo,
        tags,
        batchSize,
        delayMs,
        dryRun,
        attachments,
        isHtml: !!htmlContent,
      });

      fs.unlinkSync(tmpMd);
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Workspace: contacts
  app.get('/api/contacts', (_req, res) => {
    res.json(listContacts());
  });

  app.get('/api/contacts/:name', (req, res) => {
    const content = readContactFile(req.params.name);
    if (!content) return res.status(404).json({ error: 'Contact not found' });
    res.json({ name: req.params.name, content });
  });

  app.post('/api/contacts', (req, res) => {
    const { name, content, ext } = req.body;
    if (!name || !content || !ext) return res.status(400).json({ error: 'name, content, ext required' });
    const dest = saveContactFile(name, content, ext);
    res.json({ success: true, path: dest });
  });

  app.delete('/api/contacts/:name', (req, res) => {
    const ok = removeContactFile(req.params.name);
    if (!ok) return res.status(404).json({ error: 'Contact not found' });
    res.json({ success: true });
  });

  // Workspace: messages
  app.get('/api/messages', (_req, res) => {
    res.json(listMessages());
  });

  app.get('/api/messages/:name', (req, res) => {
    const content = readMessageFile(req.params.name);
    if (!content) return res.status(404).json({ error: 'Message not found' });
    res.json({ name: req.params.name, content });
  });

  app.post('/api/messages', (req, res) => {
    const { name, content } = req.body;
    if (!name || !content) return res.status(400).json({ error: 'name, content required' });
    const dest = saveMessageFile(name, content);
    res.json({ success: true, path: dest });
  });

  app.delete('/api/messages/:name', (req, res) => {
    const ok = removeMessageFile(req.params.name);
    if (!ok) return res.status(404).json({ error: 'Message not found' });
    res.json({ success: true });
  });

  // Email templates
  app.get('/api/email-templates', (_req, res) => {
    res.json(TEMPLATES);
  });

  // Storage
  app.get('/api/storage', (_req, res) => {
    res.json(listStorageAdapters());
  });

  app.post('/api/storage/upload', async (req, res) => {
    try {
      const { base64, filename, contentType } = req.body;
      if (!base64 || !filename) {
        return res.status(400).json({ error: 'base64 and filename required' });
      }
      const adapter = getStorageAdapter();
      if (!adapter) {
        return res.status(400).json({ error: 'No storage service configured. Set IMGBB_API_KEY in config.' });
      }
      const result = await adapter.upload(base64, filename, contentType ?? 'image/jpeg');
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  if (hasWebBuild) {
    app.use(express.static(webDist));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(webDist, 'index.html'));
    });
  } else {
    app.get('/', (_req, res) => {
      res.send(`<html><body><h1>MailFleet API</h1><p>Web dashboard not built. Run <code>npm run build:web</code> first.</p><p>API is running on <code>/api/*</code></p></body></html>`);
    });
  }

  app.listen(port, async () => {
    console.log(`\n  MailFleet dashboard running at http://localhost:${port}`);
    console.log(`  API at http://localhost:${port}/api`);
    console.log(`  Press Ctrl+C to stop\n`);
    if (openBrowser && hasWebBuild) {
      const open = (await import('open')).default;
      open(`http://localhost:${port}`);
    }
  });
}
