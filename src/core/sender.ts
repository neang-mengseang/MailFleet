import fs from 'fs';
import path from 'path';
import { getProvider, ProviderSendParams, SendResult, EmailAttachment } from '../providers/index.js';
import { renderMarkdown, wrapHtml } from './renderer.js';
import { renderTemplate } from './templater.js';
import { Recipient } from './recipients.js';
import { db } from '../db/index.js';

export interface SendOptions {
  provider: string;
  mdFile: string;
  subject: string;
  recipients: Recipient[];
  fromEmail: string;
  fromName?: string;
  replyTo?: string;
  batchSize?: number;
  delayMs?: number;
  tags?: string[];
  dryRun?: boolean;
  attachments?: EmailAttachment[];
  isHtml?: boolean;
  onProgress?: (current: number, total: number, recipient: Recipient, result: SendResult) => void;
}

export interface SendSummary {
  total: number;
  sent: number;
  failed: number;
  results: { recipient: Recipient; result: SendResult }[];
}

export async function bulkSend(opts: SendOptions): Promise<SendSummary> {
  const provider = getProvider(opts.provider);
  if (!opts.dryRun && !provider.validateConfig()) {
    throw new Error(`Provider "${opts.provider}" is not configured. Run: mailfleet config set ${provider.requiredEnv.join(' ')}`);
  }

  const md = fs.readFileSync(opts.mdFile, 'utf-8');
  const batchSize = opts.batchSize ?? 50;
  const delayMs = opts.delayMs ?? 100;
  const results: { recipient: Recipient; result: SendResult }[] = [];
  let sent = 0;
  let failed = 0;

  const batchId = opts.dryRun ? `dry-${Date.now()}` : db.createBatch({
    provider: opts.provider,
    subject: opts.subject,
    md_file: path.resolve(opts.mdFile),
    from_email: opts.fromEmail,
    from_name: opts.fromName ?? '',
    total: opts.recipients.length,
    tags: opts.tags?.join(',') ?? '',
  });

  for (let i = 0; i < opts.recipients.length; i += batchSize) {
    const batch = opts.recipients.slice(i, i + batchSize);
    const params: ProviderSendParams[] = batch.map(recipient => {
      const renderedContent = renderTemplate(md, recipient.data);
      const subject = renderTemplate(opts.subject, recipient.data);
      const html = opts.isHtml
        ? renderedContent
        : wrapHtml(renderMarkdown(renderedContent), subject);
      return {
        to: recipient.email,
        toName: recipient.name,
        from: opts.fromEmail,
        fromName: opts.fromName,
        subject: renderTemplate(opts.subject, recipient.data),
        html,
        replyTo: opts.replyTo,
        tags: opts.tags,
        attachments: opts.attachments,
      };
    });

    let batchResults: SendResult[];
    if (opts.dryRun) {
      batchResults = params.map(() => ({ success: true, messageId: 'dry-run' }));
    } else {
      batchResults = await provider.sendBatch(params);
    }

    for (let j = 0; j < batch.length; j++) {
      const recipient = batch[j];
      const result = batchResults[j];
      results.push({ recipient, result });
      if (result.success) sent++;
      else failed++;

      if (!opts.dryRun) {
        db.logSend({
          batch_id: batchId,
          recipient_email: recipient.email,
          recipient_name: recipient.name ?? '',
          subject: params[j].subject,
          success: result.success ? 1 : 0,
          message_id: result.messageId ?? '',
          error: result.error ?? '',
          provider: opts.provider,
        });
      }

      opts.onProgress?.(i + j + 1, opts.recipients.length, recipient, result);
    }

    if (i + batchSize < opts.recipients.length && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  if (!opts.dryRun) {
    db.finishBatch(batchId, sent, failed);
  }

  return { total: opts.recipients.length, sent, failed, results };
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
