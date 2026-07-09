import fs from 'fs';
import path from 'path';
import os from 'os';
import { renderMarkdown, wrapHtml } from './renderer.js';
import { renderTemplate } from './templater.js';
import { Recipient } from './recipients.js';

export interface PreviewOptions {
  mdFile: string;
  subject: string;
  recipient?: Recipient;
  output?: string;
}

export function generatePreviewHtml(opts: PreviewOptions): string {
  const md = fs.readFileSync(opts.mdFile, 'utf-8');
  const data = opts.recipient?.data ?? {};
  const renderedMd = renderTemplate(md, data);
  const bodyHtml = renderMarkdown(renderedMd);
  const subject = renderTemplate(opts.subject, data);
  return wrapHtml(bodyHtml, subject);
}

export async function previewInBrowser(opts: PreviewOptions): Promise<string> {
  const html = generatePreviewHtml(opts);
  const tmpDir = os.tmpdir();
  const fileName = `mailfleet-preview-${Date.now()}.html`;
  const filePath = path.join(tmpDir, fileName);
  fs.writeFileSync(filePath, html, 'utf-8');

  const open = (await import('open')).default;
  await open(filePath);

  return filePath;
}

export function previewToFile(opts: PreviewOptions, output: string): string {
  const html = generatePreviewHtml(opts);
  fs.writeFileSync(output, html, 'utf-8');
  return output;
}
