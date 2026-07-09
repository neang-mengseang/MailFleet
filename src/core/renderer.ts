import { marked } from 'marked';

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function renderMarkdown(md: string): string {
  return marked.parse(md) as string;
}

export function wrapHtml(content: string, subject: string): string {
  const styledContent = content
    .replace(/<img(?![^>]*style=)/gi, '<img style="max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 4px; cursor: pointer;"')
    .replace(/<img([^>]*src="([^"]*)"[^>]*)>/gi, '<a href="$2" target="_blank" style="display: block; text-decoration: none;"><img$1></a>');
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(subject)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 680px; margin: 0 auto; padding: 24px; background: #f8f9fa; }
  .email-card { background: #fff; border-radius: 8px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  h1, h2, h3 { color: #111; }
  a { color: #2563eb; }
  blockquote { border-left: 4px solid #e5e7eb; margin: 0; padding: 8px 16px; color: #6b7280; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
  pre { background: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 12px; text-align: left; }
  th { background: #f8fafc; }
  img { max-width: 100% !important; height: auto !important; display: block; margin: 12px auto; border-radius: 4px; }
  .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
</style>
</head>
<body>
<div class="email-card">
${styledContent}
</div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
