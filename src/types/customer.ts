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
  id: string; // UUID primary key
  userId?: string; // UUID references auth.users(id)
  customerName?: string; // Customer name
  name: string; // Customer name (aliases to customerName)
  productCategory?: string; // Optional product category
  category?: CustomerCategory; // Backward compatibility alias
  amount?: number; // Optional numeric amount / quantity
  priceOfGoods?: number; // Optional numeric price of goods
  outstandingDebt?: number; // Optional numeric outstanding debt
  balance?: number; // Backward compatibility alias to outstanding debt
  notes?: string; // Optional notes
  note: string; // Backward compatibility alias to notes
  phone: string; // Optional phone
  address: string; // Optional address
  province?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: CustomerStatus;
  priority?: CustomerPriority;
  email?: string;
  telegram?: string;
  currency?: 'USD' | 'KHR';
  history?: CustomerNoteHistory[];
  createdAt: string;
  updatedAt: string;
}

export type SortField = 'date' | 'name' | 'status' | 'updatedAt' | 'balance' | 'outstandingDebt';
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

// Helper to validate UUID format
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// Helper to generate a valid RFC4122 v4 UUID
export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
