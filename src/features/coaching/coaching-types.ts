export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface ChatErrorInfo {
  code: string;
  message: string;
  actionUrl?: string;
}
