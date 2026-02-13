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

export interface ReplayContext {
  timestampFormatted: string;
  timestampMs: number;
  notesAtMoment: string[];
  chordAtMoment: string | null;
  timingAccuracy: number;
  tempo: number | null;
  chordProgression: string[];
  nearbySnapshots: Array<{
    keyInsight: string;
    insightCategory: string;
    timestamp: number;
  }>;
  key: string | null;
  genre: string | null;
  windowMs: number;
}

export interface ReplayChatMessage extends ChatMessage {
  contextTimestamp: number;
}
