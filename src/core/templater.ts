const VAR_PATTERN = /\{\{\s*([\w.]+)\s*\}\}/g;

export function renderTemplate(template: string, data: Record<string, any>): string {
  return template.replace(VAR_PATTERN, (match, key: string) => {
    const value = getNested(data, key.trim());
    return value !== undefined && value !== null ? String(value) : match;
  });
}

function getNested(obj: Record<string, any>, path: string): any {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    if (current == null) return undefined;
    current = current[part];
  }
  return current;
}

export function extractVariables(template: string): string[] {
  const vars = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(VAR_PATTERN, 'g');
  while ((match = re.exec(template)) !== null) {
    vars.add(match[1].trim());
  }
  return [...vars];
}
