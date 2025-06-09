
export type Priority = 'high' | 'medium' | 'low';

export type Category = {
  id: string;
  name: string;
  icon: string; // Lucide icon name
};

export type ActivityLog = {
  hour: number; // 0-23
  description: string;
  categoryId: string | null;
  priority: Priority | null;
  notes15Min?: string[]; // Array of 4 strings for :00, :15, :30, :45 intervals
};

