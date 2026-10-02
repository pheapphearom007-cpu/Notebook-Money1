export type CustomerStatus = 'active' | 'pending' | 'debt' | 'completed' | 'inactive';

export type CustomerCategory = 'retail' | 'wholesale' | 'vip' | 'service' | 'online' | 'general';

export type CustomerPriority = 'low' | 'medium' | 'high';

export interface CustomerNoteHistory {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export interface Customer {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  address: string;
  province?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  note: string;
  status: CustomerStatus;
  category?: CustomerCategory;
  priority?: CustomerPriority;
  email?: string;
  telegram?: string;
  balance?: number; // Optional ledger balance or transaction amount
  currency?: 'USD' | 'KHR';
  history?: CustomerNoteHistory[];
  createdAt: string;
  updatedAt: string;
}

export type SortField = 'date' | 'name' | 'status' | 'updatedAt' | 'balance';
export type SortOrder = 'asc' | 'desc';

export interface CustomerFilterOptions {
  searchQuery: string;
  status: CustomerStatus | 'all';
  category: CustomerCategory | 'all';
  province: string | 'all';
  village?: string | 'all';
  sortBy: SortField;
  sortOrder: SortOrder;
}
