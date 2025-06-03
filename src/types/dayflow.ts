
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
};
