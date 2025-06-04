// src/app/types.ts
export type ScheduleItem = {
  id?: string
  title: string
  type: string
  channel: string
  status: string
  date: string // "2025-06-03"
  time: string // "13:00"
  color?: string
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_done' | 'deadline' | 'message' | 'trend_alert' | 'event_today' | 'system' | string;
  title: string;
  message?: string;
  link?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  importance: 'normal' | 'important' | 'critical';
}