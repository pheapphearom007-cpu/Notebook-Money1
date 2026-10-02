export type NoteColor = 'yellow' | 'blue' | 'green' | 'purple' | 'rose' | 'default';

export interface GeneralNote {
  id: string;
  userId?: string;
  title: string;
  content: string;
  category?: string;
  customerId?: string; // Optional link to a customer
  customerName?: string;
  color: NoteColor;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}
