import React, { createContext, useContext, useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Customer,
  CustomerStatus,
  CustomerCategory,
  CustomerFilterOptions,
  SortField,
  SortOrder,
  generateUUID,
} from '../types/customer';
import { GeneralNote } from '../types/note';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
import { CustomerService } from '../services/customerService';
import { isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { INITIAL_CUSTOMERS, INITIAL_NOTES } from '../services/sampleData';

interface CustomerStats {
  totalCustomers: number;
  todayNotes: number;
  activeCustomers: number;
  pendingCustomers: number;
  debtCustomers: number;
  completedCustomers: number;
  inactiveCustomers: number;
  totalBalance: number;
  recentCustomers: Customer[];
  recentlyUpdatedNotes: GeneralNote[];
}

interface CustomerContextType {
  customers: Customer[];
  notes: GeneralNote[];
  filteredCustomers: Customer[];
  filterOptions: CustomerFilterOptions;
  isDataLoading: boolean;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (status: CustomerStatus | 'all') => void;
  setCategoryFilter: (category: CustomerCategory | 'all') => void;
  setProvinceFilter: (province: string | 'all') => void;
  setVillageFilter: (village: string | 'all') => void;
  setSortBy: (field: SortField) => void;
  setSortOrder: (order: SortOrder) => void;
  resetFilters: () => void;
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Customer>;
  updateCustomer: (id: string, data: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addCustomerHistoryNote: (customerId: string, noteContent: string) => Promise<void>;
  addNote: (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>) => Promise<GeneralNote>;
  updateNote: (id: string, data: Partial<GeneralNote>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  stats: CustomerStats;
  exportJson: () => void;
  exportCsv: () => void;
  importJson: (file: File) => Promise<{ success: boolean; customerCount?: number; noteCount?: number; error?: string }>;
  resetToSample: () => Promise<void>;
  clearAll: () => Promise<void>;
  refreshData: () => Promise<void>;
  migrateLocalDataToCloud: () => Promise<{ success: boolean; customersMigrated: number; notesMigrated: number; error?: string }>;
}

const defaultFilterOptions: CustomerFilterOptions = {
  searchQuery: '',
  status: 'all',
  category: 'all',
  province: 'all',
  village: 'all',
  sortBy: 'date',
  sortOrder: 'desc',
};

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Initialize records from local vault cache to prevent layout jumps on reload
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = ApiService.getSavedSession()?.user;
    const targetUserId = user?.id || saved?.id;
    if (targetUserId) {
      return ApiService.getCachedCustomers(targetUserId);
    }
    return [];
  });

  const [notes, setNotes] = useState<GeneralNote[]>(() => {
    const saved = ApiService.getSavedSession()?.user;
    const targetUserId = user?.id || saved?.id;
    if (targetUserId) {
      return ApiService.getCachedNotes(targetUserId);
    }
    return [];
  });

  const [isDataLoading, setIsDataLoading] = useState<boolean>(() => {
    const saved = ApiService.getSavedSession()?.user;
    const targetUserId = user?.id || saved?.id;
    if (targetUserId) {
      const cached = ApiService.getCachedCustomers(targetUserId);
      return cached.length === 0;
    }
    return false;
  });

  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions>(defaultFilterOptions);

  // Keep ref of customers for realtime callbacks to avoid stale state
  const customersRef = useRef<Customer[]>(customers);
  useEffect(() => {
    customersRef.current = customers;
  }, [customers]);

  const notesRef = useRef<GeneralNote[]>(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // ============================================================================
  // LOAD & REFRESH DATA (Source of Truth: Cloud PostgreSQL)
  // ============================================================================
  const refreshData = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setNotes([]);
      setIsDataLoading(false);
      return;
    }

    const cachedCust = ApiService.getCachedCustomers(user.id);
    const cachedNotes = ApiService.getCachedNotes(user.id);

    if (cachedCust.length === 0 && cachedNotes.length === 0) {
      setIsDataLoading(true);
    }

    try {
      if (isSupabaseConfigured()) {
        const [cloudCustomers, cloudNotes] = await Promise.all([
          CustomerService.getCustomers(user.id),
          CustomerService.getNotes(user.id),
        ]);

        setCustomers(cloudCustomers);
        setNotes(cloudNotes);
        ApiService.cacheCustomers(user.id, cloudCustomers);
        ApiService.cacheNotes(user.id, cloudNotes);
      } else {
        // Fallback: Central API / local vault
        const [cloudCust, cloudNotes] = await Promise.all([
          ApiService.getCustomers('', user.id),
          ApiService.getNotes('', user.id),
        ]);
        setCustomers(cloudCust);
        setNotes(cloudNotes);
      }
    } catch (err) {
      console.warn('Network issue fetching cloud records, fallback to local vault cache:', err);
      const fallbackCust = ApiService.getCachedCustomers(user.id);
      const fallbackNotes = ApiService.getCachedNotes(user.id);
      setCustomers(fallbackCust);
      setNotes(fallbackNotes);
    } finally {
      setIsDataLoading(false);
    }
  }, [user]);

  // Reload when user changes
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // ============================================================================
  // SUPABASE REALTIME SUBSCRIPTION (Multi-device live sync)
  // ============================================================================
  useEffect(() => {
    if (!user || !isSupabaseConfigured()) {
      return;
    }

    const currentUserId = user.id;

    // Realtime Customer Listener with DUPLICATE PREVENTION
    const unsubscribeCustomers = CustomerService.subscribeToCustomers(currentUserId, {
      onInsert: (newCustomer) => {
        setCustomers((prev) => {
          // Realtime duplicate prevention
          const exists = prev.some((c) => c.id === newCustomer.id);
          if (exists) {
            return prev.map((c) => (c.id === newCustomer.id ? { ...c, ...newCustomer } : c));
          }
          const updated = [newCustomer, ...prev];
          ApiService.cacheCustomers(currentUserId, updated);
          return updated;
        });
      },
      onUpdate: (updatedCustomer) => {
        setCustomers((prev) => {
          const updated = prev.map((c) =>
            c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c
          );
          ApiService.cacheCustomers(currentUserId, updated);
          return updated;
        });
      },
      onDelete: (deletedId) => {
        setCustomers((prev) => {
          const updated = prev.filter((c) => c.id !== deletedId);
          ApiService.cacheCustomers(currentUserId, updated);
          return updated;
        });
      },
    });

    // Realtime Notes Listener
    const unsubscribeNotes = CustomerService.subscribeToNotes(currentUserId, {
      onInsert: (newNote) => {
        setNotes((prev) => {
          const exists = prev.some((n) => n.id === newNote.id);
          if (exists) {
            return prev.map((n) => (n.id === newNote.id ? { ...n, ...newNote } : n));
          }
          const updated = [newNote, ...prev];
          ApiService.cacheNotes(currentUserId, updated);
          return updated;
        });
      },
      onUpdate: (updatedNote) => {
        setNotes((prev) => {
          const updated = prev.map((n) => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n));
          ApiService.cacheNotes(currentUserId, updated);
          return updated;
        });
      },
      onDelete: (deletedId) => {
        setNotes((prev) => {
          const updated = prev.filter((n) => n.id !== deletedId);
          ApiService.cacheNotes(currentUserId, updated);
          return updated;
        });
      },
    });

    // Clean up Supabase channels on unmount or user change
    return () => {
      unsubscribeCustomers();
      unsubscribeNotes();
    };
  }, [user]);

  // ============================================================================
  // CUSTOMER CRUD
  // ============================================================================
  const addCustomer = useCallback(
    async (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> => {
      if (!user) {
        throw new Error('User must be authenticated to add customers');
      }

      const now = new Date().toISOString();
      const rawDebt = Number(data.outstandingDebt ?? data.balance ?? 0);
      const name = data.customerName || data.name;
      const newCustomer: Customer = {
        ...data,
        id: generateUUID(),
        userId: user.id,
        customerName: name,
        name,
        outstandingDebt: rawDebt,
        balance: rawDebt,
        history: data.history || [],
        createdAt: now,
        updatedAt: now,
      };

      // Optimistic update
      setCustomers((prev) => {
        const updated = [newCustomer, ...prev.filter((c) => c.id !== newCustomer.id)];
        ApiService.cacheCustomers(user.id, updated);
        return updated;
      });

      // Cloud PostgreSQL insertion
      if (isSupabaseConfigured()) {
        try {
          const savedCloud = await CustomerService.createCustomer(user.id, data);
          setCustomers((prev) => {
            const updated = prev.map((c) => (c.id === newCustomer.id ? savedCloud : c));
            ApiService.cacheCustomers(user.id, updated);
            return updated;
          });
          return savedCloud;
        } catch (err) {
          console.error('Failed to save customer to cloud:', err);
          throw err;
        }
      } else {
        await ApiService.createCustomer('', user.id, newCustomer);
      }

      return newCustomer;
    },
    [user]
  );

  const updateCustomer = useCallback(
    async (id: string, data: Partial<Customer>): Promise<void> => {
      if (!user) return;
      const now = new Date().toISOString();

      // Optimistic update
      setCustomers((prev) => {
        const updated = prev.map((c) => {
          if (c.id === id) {
            const debt = data.outstandingDebt !== undefined ? data.outstandingDebt : (data.balance !== undefined ? data.balance : c.outstandingDebt);
            return {
              ...c,
              ...data,
              outstandingDebt: debt,
              balance: debt,
              updatedAt: now,
            };
          }
          return c;
        });
        ApiService.cacheCustomers(user.id, updated);
        return updated;
      });

      // Cloud PostgreSQL update
      if (isSupabaseConfigured()) {
        try {
          await CustomerService.updateCustomer(user.id, id, data);
        } catch (err) {
          console.error('Failed to update customer in cloud:', err);
          throw err;
        }
      } else {
        await ApiService.updateCustomer('', user.id, id, data);
      }
    },
    [user]
  );

  const deleteCustomer = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      // Optimistic update
      setCustomers((prev) => {
        const updated = prev.filter((c) => c.id !== id);
        ApiService.cacheCustomers(user.id, updated);
        return updated;
      });

      // Cloud PostgreSQL deletion
      if (isSupabaseConfigured()) {
        try {
          await CustomerService.deleteCustomer(user.id, id);
        } catch (err) {
          console.error('Failed to delete customer in cloud:', err);
          throw err;
        }
      } else {
        await ApiService.deleteCustomer('', user.id, id);
      }
    },
    [user]
  );

  const addCustomerHistoryNote = useCallback(
    async (customerId: string, noteContent: string): Promise<void> => {
      if (!user) return;
      const now = new Date().toISOString();
      const historyItem = {
        id: `hist-${Date.now()}`,
        content: noteContent.trim(),
        createdAt: now,
      };

      const targetCustomer = customers.find((c) => c.id === customerId);
      if (!targetCustomer) return;

      const newHistory = [historyItem, ...(targetCustomer.history || [])];

      await updateCustomer(customerId, {
        history: newHistory,
      });
    },
    [user, customers, updateCustomer]
  );

  // ============================================================================
  // NOTE CRUD
  // ============================================================================
  const addNote = useCallback(
    async (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<GeneralNote> => {
      if (!user) throw new Error('User must be authenticated');
      const now = new Date().toISOString();
      const newNote: GeneralNote = {
        ...data,
        id: generateUUID(),
        userId: user.id,
        createdAt: now,
        updatedAt: now,
      };

      setNotes((prev) => {
        const updated = [newNote, ...prev.filter((n) => n.id !== newNote.id)];
        ApiService.cacheNotes(user.id, updated);
        return updated;
      });

      if (isSupabaseConfigured()) {
        try {
          const saved = await CustomerService.createNote(user.id, data);
          setNotes((prev) => {
            const updated = prev.map((n) => (n.id === newNote.id ? saved : n));
            ApiService.cacheNotes(user.id, updated);
            return updated;
          });
          return saved;
        } catch (err) {
          console.error('Failed to save note to cloud:', err);
          throw err;
        }
      } else {
        await ApiService.createNote('', user.id, newNote);
      }

      return newNote;
    },
    [user]
  );

  const updateNote = useCallback(
    async (id: string, data: Partial<GeneralNote>): Promise<void> => {
      if (!user) return;
      const now = new Date().toISOString();

      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, ...data, updatedAt: now } : n));
        ApiService.cacheNotes(user.id, updated);
        return updated;
      });

      if (isSupabaseConfigured()) {
        await CustomerService.updateNote(user.id, id, data);
      } else {
        await ApiService.updateNote('', user.id, id, data);
      }
    },
    [user]
  );

  const deleteNote = useCallback(
    async (id: string): Promise<void> => {
      if (!user) return;

      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        ApiService.cacheNotes(user.id, updated);
        return updated;
      });

      if (isSupabaseConfigured()) {
        await CustomerService.deleteNote(user.id, id);
      } else {
        await ApiService.deleteNote('', user.id, id);
      }
    },
    [user]
  );

  const togglePinNote = useCallback(
    async (id: string): Promise<void> => {
      const target = notes.find((n) => n.id === id);
      if (target) {
        await updateNote(id, { isPinned: !target.isPinned });
      }
    },
    [notes, updateNote]
  );

  // ============================================================================
  // DATA MIGRATION TO CLOUD
  // ============================================================================
  const migrateLocalDataToCloud = useCallback(async () => {
    if (!user) {
      return { success: false, customersMigrated: 0, notesMigrated: 0, error: 'User is not authenticated' };
    }
    if (!isSupabaseConfigured()) {
      return { success: false, customersMigrated: 0, notesMigrated: 0, error: 'Supabase is not configured' };
    }

    try {
      const localCustomers = ApiService.getCachedCustomers(user.id);
      const localNotes = ApiService.getCachedNotes(user.id);

      const result = await CustomerService.migrateLegacyDataToCloud(
        user.id,
        localCustomers.length > 0 ? localCustomers : customers,
        localNotes.length > 0 ? localNotes : notes
      );

      await refreshData();
      return {
        success: true,
        customersMigrated: result.customersMigrated,
        notesMigrated: result.notesMigrated,
      };
    } catch (err: any) {
      return {
        success: false,
        customersMigrated: 0,
        notesMigrated: 0,
        error: err.message || 'Migration failed',
      };
    }
  }, [user, customers, notes, refreshData]);

  // Import / Export
  const exportJson = useCallback(() => {
    StorageService.exportToJson();
  }, []);

  const exportCsv = useCallback(() => {
    StorageService.exportCustomersToCsv(customers);
  }, [customers]);

  const importJson = useCallback(
    async (file: File) => {
      const result = await StorageService.importFromJson(file);
      if (result.success && user) {
        const importedCustomers = StorageService.getCustomers().map((c) => ({
          ...c,
          userId: user.id,
          id: generateUUID(),
        }));
        const importedNotes = StorageService.getNotes().map((n) => ({
          ...n,
          userId: user.id,
          id: generateUUID(),
        }));

        setCustomers(importedCustomers);
        setNotes(importedNotes);

        if (isSupabaseConfigured()) {
          CustomerService.migrateLegacyDataToCloud(user.id, importedCustomers, importedNotes).catch(console.warn);
        }
      }
      return result;
    },
    [user]
  );

  const resetToSample = useCallback(async () => {
    if (!user) return;
    const seedCustomers: Customer[] = INITIAL_CUSTOMERS.map((c) => {
      const rawDebt = Number((c as any).outstandingDebt ?? c.balance ?? 0);
      return {
        ...c,
        id: generateUUID(),
        userId: user.id,
        customerName: c.name,
        name: c.name,
        outstandingDebt: rawDebt,
        balance: rawDebt,
      };
    });

    const seedNotes: GeneralNote[] = INITIAL_NOTES.map((n) => ({
      ...n,
      id: generateUUID(),
      userId: user.id,
    }));

    setCustomers(seedCustomers);
    setNotes(seedNotes);
    ApiService.cacheCustomers(user.id, seedCustomers);
    ApiService.cacheNotes(user.id, seedNotes);

    if (isSupabaseConfigured()) {
      CustomerService.migrateLegacyDataToCloud(user.id, seedCustomers, seedNotes).catch(console.warn);
    }
  }, [user]);

  const clearAll = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      for (const c of customers) {
        CustomerService.deleteCustomer(user.id, c.id).catch(console.warn);
      }
      for (const n of notes) {
        CustomerService.deleteNote(user.id, n.id).catch(console.warn);
      }
    }
    setCustomers([]);
    setNotes([]);
    ApiService.cacheCustomers(user.id, []);
    ApiService.cacheNotes(user.id, []);
  }, [user, customers, notes]);

  // Filter & Sort Setters
  const setSearchQuery = useCallback((query: string) => {
    setFilterOptions((prev) => ({ ...prev, searchQuery: query }));
  }, []);

  const setStatusFilter = useCallback((status: CustomerStatus | 'all') => {
    setFilterOptions((prev) => ({ ...prev, status }));
  }, []);

  const setCategoryFilter = useCallback((category: CustomerCategory | 'all') => {
    setFilterOptions((prev) => ({ ...prev, category }));
  }, []);

  const setProvinceFilter = useCallback((province: string | 'all') => {
    setFilterOptions((prev) => ({ ...prev, province }));
  }, []);

  const setVillageFilter = useCallback((village: string | 'all') => {
    setFilterOptions((prev) => ({ ...prev, village }));
  }, []);

  const setSortBy = useCallback((sortBy: SortField) => {
    setFilterOptions((prev) => ({ ...prev, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: SortOrder) => {
    setFilterOptions((prev) => ({ ...prev, sortOrder }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterOptions(defaultFilterOptions);
  }, []);

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        if (filterOptions.searchQuery.trim()) {
          const q = filterOptions.searchQuery.toLowerCase().trim();
          const matchName = (c.customerName || c.name)?.toLowerCase().includes(q);
          const matchPhone = c.phone?.toLowerCase().includes(q);
          const matchAddress = c.address?.toLowerCase().includes(q);
          const matchNote = (c.notes || c.note)?.toLowerCase().includes(q);
          const matchTelegram = c.telegram?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchAddress && !matchNote && !matchTelegram) {
            return false;
          }
        }

        if (filterOptions.status !== 'all' && c.status !== filterOptions.status) {
          return false;
        }

        if (filterOptions.category !== 'all' && (c.productCategory || c.category) !== filterOptions.category) {
          return false;
        }

        if (filterOptions.province !== 'all' && c.province !== filterOptions.province) {
          return false;
        }

        if (
          filterOptions.village &&
          filterOptions.village !== 'all' &&
          !c.address?.includes(filterOptions.village)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const orderMod = filterOptions.sortOrder === 'asc' ? 1 : -1;
        if (filterOptions.sortBy === 'name') {
          return (a.customerName || a.name).localeCompare((b.customerName || b.name), 'km') * orderMod;
        }
        if (filterOptions.sortBy === 'balance' || filterOptions.sortBy === 'outstandingDebt') {
          const balA = a.outstandingDebt ?? a.balance ?? 0;
          const balB = b.outstandingDebt ?? b.balance ?? 0;
          return (balA - balB) * orderMod;
        }
        if (filterOptions.sortBy === 'status') {
          return a.status.localeCompare(b.status) * orderMod;
        }
        if (filterOptions.sortBy === 'updatedAt') {
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * orderMod;
        }
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * orderMod;
      });
  }, [customers, filterOptions]);

  // Stats
  const stats = useMemo<CustomerStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayNotesCount =
      customers.filter((c) => c.date === today).length +
      notes.filter((n) => n.createdAt.startsWith(today)).length;

    const activeCount = customers.filter((c) => c.status === 'active').length;
    const pendingCount = customers.filter((c) => c.status === 'pending').length;
    const debtCount = customers.filter((c) => c.status === 'debt' || (c.outstandingDebt && c.outstandingDebt > 0)).length;
    const completedCount = customers.filter((c) => c.status === 'completed').length;
    const inactiveCount = customers.filter((c) => c.status === 'inactive').length;
    const totalBal = customers.reduce((acc, c) => acc + (c.outstandingDebt ?? c.balance ?? 0), 0);

    const sortedByCreated = [...customers].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const sortedNotes = [...notes].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return {
      totalCustomers: customers.length,
      todayNotes: todayNotesCount,
      activeCustomers: activeCount,
      pendingCustomers: pendingCount,
      debtCustomers: debtCount,
      completedCustomers: completedCount,
      inactiveCustomers: inactiveCount,
      totalBalance: totalBal,
      recentCustomers: sortedByCreated.slice(0, 5),
      recentlyUpdatedNotes: sortedNotes.slice(0, 5),
    };
  }, [customers, notes]);

  return (
    <CustomerContext.Provider
      value={{
        customers,
        notes,
        filteredCustomers,
        filterOptions,
        isDataLoading,
        setSearchQuery,
        setStatusFilter,
        setCategoryFilter,
        setProvinceFilter,
        setVillageFilter,
        setSortBy,
        setSortOrder,
        resetFilters,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCustomerHistoryNote,
        addNote,
        updateNote,
        deleteNote,
        togglePinNote,
        stats,
        exportJson,
        exportCsv,
        importJson,
        resetToSample,
        clearAll,
        refreshData,
        migrateLocalDataToCloud,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomers = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomers must be used within a CustomerProvider');
  }
  return context;
};
