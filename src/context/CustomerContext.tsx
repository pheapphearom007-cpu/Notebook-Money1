import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from 'react';
import {
  Customer,
  CustomerStatus,
  CustomerCategory,
  CustomerFilterOptions,
  SortField,
  SortOrder,
} from '../types/customer';
import { GeneralNote } from '../types/note';
import { StorageService } from '../services/storage';
import { ApiService } from '../services/api';
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
  addCustomer: (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  updateCustomer: (id: string, data: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  addCustomerHistoryNote: (customerId: string, noteContent: string) => void;
  addNote: (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>) => GeneralNote;
  updateNote: (id: string, data: Partial<GeneralNote>) => void;
  deleteNote: (id: string) => void;
  togglePinNote: (id: string) => void;
  stats: CustomerStats;
  exportJson: () => void;
  exportCsv: () => void;
  importJson: (file: File) => Promise<{ success: boolean; customerCount?: number; noteCount?: number; error?: string }>;
  resetToSample: () => void;
  clearAll: () => void;
  refreshData: () => Promise<void>;
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
  const { user, token } = useAuth();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [notes, setNotes] = useState<GeneralNote[]>([]);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
  const [filterOptions, setFilterOptions] = useState<CustomerFilterOptions>(defaultFilterOptions);

  const refreshData = useCallback(async () => {
    if (!user) {
      setCustomers([]);
      setNotes([]);
      setIsDataLoading(false);
      return;
    }

    setIsDataLoading(true);
    try {
      const [cloudCustomers, cloudNotes] = await Promise.all([
        ApiService.getCustomers(token || '', user.id),
        ApiService.getNotes(token || '', user.id),
      ]);

      // If brand new account with no records yet, provide initial seed for user
      if (cloudCustomers.length === 0 && cloudNotes.length === 0) {
        const cachedCust = ApiService.getCachedCustomers(user.id);
        if (cachedCust.length === 0) {
          const seedCustomers = INITIAL_CUSTOMERS.slice(0, 3).map((c) => ({
            ...c,
            id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: user.id,
          }));
          const seedNotes = INITIAL_NOTES.slice(0, 1).map((n) => ({
            ...n,
            id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            userId: user.id,
          }));

          setCustomers(seedCustomers);
          setNotes(seedNotes);
          ApiService.cacheCustomers(user.id, seedCustomers);
          ApiService.cacheNotes(user.id, seedNotes);

          // Persist seed to server in background
          if (token) {
            seedCustomers.forEach((c) => ApiService.createCustomer(token, user.id, c));
            seedNotes.forEach((n) => ApiService.createNote(token, user.id, n));
          }
          setIsDataLoading(false);
          return;
        }
      }

      setCustomers(cloudCustomers);
      setNotes(cloudNotes);
    } catch (err) {
      console.warn('Network issue loading cloud records, using local vault:', err);
      const cachedCust = ApiService.getCachedCustomers(user.id);
      const cachedNotes = ApiService.getCachedNotes(user.id);
      setCustomers(cachedCust);
      setNotes(cachedNotes);
    } finally {
      setIsDataLoading(false);
    }
  }, [user, token]);

  // Synchronize customer & note records for the authenticated user
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Filter setters
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

  // Customer CRUD
  const addCustomer = useCallback(
    (data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer => {
      const now = new Date().toISOString();
      const currentUserId = user?.id || 'guest';
      const newCustomer: Customer = {
        ...data,
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUserId,
        history: data.history || [],
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newCustomer, ...customers];
      setCustomers(updated);

      if (user && token) {
        ApiService.createCustomer(token, user.id, newCustomer).catch((err) => {
          console.warn('Async cloud customer save notice:', err);
        });
      } else {
        StorageService.saveCustomers(updated);
      }

      return newCustomer;
    },
    [customers, user, token]
  );

  const updateCustomer = useCallback(
    (id: string, data: Partial<Customer>) => {
      const now = new Date().toISOString();
      const updated = customers.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: now } : c
      );
      setCustomers(updated);

      if (user && token) {
        ApiService.updateCustomer(token, user.id, id, data).catch((err) => {
          console.warn('Async cloud customer update notice:', err);
        });
      } else {
        StorageService.saveCustomers(updated);
      }
    },
    [customers, user, token]
  );

  const deleteCustomer = useCallback(
    (id: string) => {
      const updated = customers.filter((c) => c.id !== id);
      setCustomers(updated);

      if (user && token) {
        ApiService.deleteCustomer(token, user.id, id).catch((err) => {
          console.warn('Async cloud customer delete notice:', err);
        });
      } else {
        StorageService.saveCustomers(updated);
      }
    },
    [customers, user, token]
  );

  const addCustomerHistoryNote = useCallback(
    (customerId: string, noteContent: string) => {
      const now = new Date().toISOString();
      const historyItem = {
        id: `hist-${Date.now()}`,
        content: noteContent.trim(),
        createdAt: now,
      };

      const updated = customers.map((c) => {
        if (c.id === customerId) {
          const newHistory = [historyItem, ...(c.history || [])];
          const updatedCust = { ...c, history: newHistory, updatedAt: now };

          if (user && token) {
            ApiService.updateCustomer(token, user.id, customerId, { history: newHistory });
          }

          return updatedCust;
        }
        return c;
      });

      setCustomers(updated);
      if (!user) {
        StorageService.saveCustomers(updated);
      }
    },
    [customers, user, token]
  );

  // Note CRUD
  const addNote = useCallback(
    (data: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>): GeneralNote => {
      const now = new Date().toISOString();
      const currentUserId = user?.id || 'guest';
      const newNote: GeneralNote = {
        ...data,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUserId,
        createdAt: now,
        updatedAt: now,
      };

      const updated = [newNote, ...notes];
      setNotes(updated);

      if (user && token) {
        ApiService.createNote(token, user.id, newNote).catch((err) => {
          console.warn('Async cloud note save notice:', err);
        });
      } else {
        StorageService.saveNotes(updated);
      }

      return newNote;
    },
    [notes, user, token]
  );

  const updateNote = useCallback(
    (id: string, data: Partial<GeneralNote>) => {
      const now = new Date().toISOString();
      const updated = notes.map((n) =>
        n.id === id ? { ...n, ...data, updatedAt: now } : n
      );
      setNotes(updated);

      if (user && token) {
        ApiService.updateNote(token, user.id, id, data).catch((err) => {
          console.warn('Async cloud note update notice:', err);
        });
      } else {
        StorageService.saveNotes(updated);
      }
    },
    [notes, user, token]
  );

  const deleteNote = useCallback(
    (id: string) => {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);

      if (user && token) {
        ApiService.deleteNote(token, user.id, id).catch((err) => {
          console.warn('Async cloud note delete notice:', err);
        });
      } else {
        StorageService.saveNotes(updated);
      }
    },
    [notes, user, token]
  );

  const togglePinNote = useCallback(
    (id: string) => {
      const now = new Date().toISOString();
      let targetPinned = false;
      const updated = notes.map((n) => {
        if (n.id === id) {
          targetPinned = !n.isPinned;
          return { ...n, isPinned: targetPinned, updatedAt: now };
        }
        return n;
      });
      setNotes(updated);

      if (user && token) {
        ApiService.updateNote(token, user.id, id, { isPinned: targetPinned }).catch((err) => {
          console.warn('Async cloud note pin notice:', err);
        });
      } else {
        StorageService.saveNotes(updated);
      }
    },
    [notes, user, token]
  );

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
        }));
        const importedNotes = StorageService.getNotes().map((n) => ({
          ...n,
          userId: user.id,
        }));

        setCustomers(importedCustomers);
        setNotes(importedNotes);

        if (token) {
          importedCustomers.forEach((c) => ApiService.createCustomer(token, user.id, c));
          importedNotes.forEach((n) => ApiService.createNote(token, user.id, n));
        }
      }
      return result;
    },
    [user, token]
  );

  const resetToSample = useCallback(() => {
    if (user) {
      const seedCustomers = INITIAL_CUSTOMERS.map((c) => ({
        ...c,
        id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
      }));
      const seedNotes = INITIAL_NOTES.map((n) => ({
        ...n,
        id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
      }));

      setCustomers(seedCustomers);
      setNotes(seedNotes);
      ApiService.cacheCustomers(user.id, seedCustomers);
      ApiService.cacheNotes(user.id, seedNotes);

      if (token) {
        seedCustomers.forEach((c) => ApiService.createCustomer(token, user.id, c));
        seedNotes.forEach((n) => ApiService.createNote(token, user.id, n));
      }
    }
  }, [user, token]);

  const clearAll = useCallback(() => {
    if (user) {
      customers.forEach((c) => {
        if (token) ApiService.deleteCustomer(token, user.id, c.id);
      });
      notes.forEach((n) => {
        if (token) ApiService.deleteNote(token, user.id, n.id);
      });
      ApiService.cacheCustomers(user.id, []);
      ApiService.cacheNotes(user.id, []);
    }
    setCustomers([]);
    setNotes([]);
  }, [user, token, customers, notes]);

  // Filtered and Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((c) => {
        // Search query
        if (filterOptions.searchQuery.trim()) {
          const q = filterOptions.searchQuery.toLowerCase().trim();
          const matchName = c.name?.toLowerCase().includes(q);
          const matchPhone = c.phone?.toLowerCase().includes(q);
          const matchAddress = c.address?.toLowerCase().includes(q);
          const matchNote = c.note?.toLowerCase().includes(q);
          const matchTelegram = c.telegram?.toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchAddress && !matchNote && !matchTelegram) {
            return false;
          }
        }

        // Status filter
        if (filterOptions.status !== 'all' && c.status !== filterOptions.status) {
          return false;
        }

        // Category filter
        if (filterOptions.category !== 'all' && c.category !== filterOptions.category) {
          return false;
        }

        // Province filter
        if (filterOptions.province !== 'all' && c.province !== filterOptions.province) {
          return false;
        }

        // Village filter
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
          return a.name.localeCompare(b.name, 'km') * orderMod;
        }
        if (filterOptions.sortBy === 'balance') {
          return ((a.balance || 0) - (b.balance || 0)) * orderMod;
        }
        if (filterOptions.sortBy === 'status') {
          return a.status.localeCompare(b.status) * orderMod;
        }
        if (filterOptions.sortBy === 'updatedAt') {
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * orderMod;
        }
        // default 'date'
        return (new Date(a.date).getTime() - new Date(b.date).getTime()) * orderMod;
      });
  }, [customers, filterOptions]);

  // Calculated Stats
  const stats = useMemo<CustomerStats>(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayNotesCount =
      customers.filter((c) => c.date === today).length +
      notes.filter((n) => n.createdAt.startsWith(today)).length;

    const activeCount = customers.filter((c) => c.status === 'active').length;
    const pendingCount = customers.filter((c) => c.status === 'pending').length;
    const debtCount = customers.filter((c) => c.status === 'debt').length;
    const completedCount = customers.filter((c) => c.status === 'completed').length;
    const inactiveCount = customers.filter((c) => c.status === 'inactive').length;
    const totalBal = customers.reduce((acc, c) => acc + (c.balance || 0), 0);

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
