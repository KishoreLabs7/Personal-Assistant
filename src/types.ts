export interface GmailMessage {
  id: string;
  threadId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
}

export interface EmailAnalysis {
  id: string; // matches email id
  is_important: boolean;
  category: 'Action Required' | 'Informational' | 'Social/Personal' | 'Newsletter' | 'System Notification';
  summary: string;
  reason: string;
}

export interface CalendarMeeting {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO event time or DateTime
  end: string;
  location?: string;
  meetLink?: string;
}
