export interface EmailAttachment {
  filename: string;
  content: string;
  contentType: string;
  encoding?: 'base64';
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface ProviderSendParams {
  to: string;
  toName?: string;
  from: string;
  fromName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  tags?: string[];
  customArgs?: Record<string, string>;
  attachments?: EmailAttachment[];
}

export interface Provider {
  id: string;
  name: string;
  requiredEnv: string[];
  validateConfig(): boolean;
  send(params: ProviderSendParams): Promise<SendResult>;
  sendBatch(params: ProviderSendParams[]): Promise<SendResult[]>;
}
