import { Customer } from '../types/customer';
import { GeneralNote } from '../types/note';
import { INITIAL_CUSTOMERS, INITIAL_NOTES } from './sampleData';

const CUSTOMERS_KEY = 'sievphov_banchy_customers_v1';
const NOTES_KEY = 'sievphov_banchy_notes_v1';
const SETTINGS_KEY = 'sievphov_banchy_settings_v1';

export interface StorageExportData {
  version: string;
  exportedAt: string;
  appName: string;
  customers: Customer[];
  notes: GeneralNote[];
}

export const StorageService = {
  // Load Customers
  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem(CUSTOMERS_KEY);
      if (!data) {
        // Initialize with default sample data
        this.saveCustomers(INITIAL_CUSTOMERS);
        return INITIAL_CUSTOMERS;
      }
      return JSON.parse(data) as Customer[];
    } catch (e) {
      console.error('Failed to load customers from localStorage', e);
      return INITIAL_CUSTOMERS;
    }
  },

  // Save Customers
  saveCustomers(customers: Customer[]): void {
    try {
      localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  },

  // Load General Notes
  getNotes(): GeneralNote[] {
    try {
      const data = localStorage.getItem(NOTES_KEY);
      if (!data) {
        this.saveNotes(INITIAL_NOTES);
        return INITIAL_NOTES;
      }
      return JSON.parse(data) as GeneralNote[];
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
      return INITIAL_NOTES;
    }
  },

  // Save General Notes
  saveNotes(notes: GeneralNote[]): void {
    try {
      localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to save notes to localStorage', e);
    }
  },

  // Export all data to JSON file
  exportToJson(): void {
    const exportData: StorageExportData = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      appName: 'សៀវភៅបញ្ជី (Sievphov Banchy)',
      customers: this.getCustomers(),
      notes: this.getNotes(),
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(exportData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('download', `sievphov_banchy_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  // Export customers to CSV with UTF-8 BOM for Microsoft Excel Khmer support
  exportCustomersToCsv(customers: Customer[]): void {
    const headers = [
      'ឈ្មោះអតិថិជន / Customer Name',
      'លេខទូរស័ព្ទ / Phone',
      'Telegram',
      'អ៊ីមែល / Email',
      'អាសយដ្ឋាន / Address',
      'រាជធានី-ខេត្ត / Province',
      'កាលបរិច្ឆេទ / Date',
      'ស្ថានភាព / Status',
      'ប្រភេទ / Category',
      'ទឹកប្រាក់ / Balance (USD)',
      'កំណត់ចំណាំ / Note',
      'កាលបរិច្ឆេទបង្កើត / Created At',
    ];

    const rows = customers.map((c) => [
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.phone || '').replace(/"/g, '""')}"`,
      `"${(c.telegram || '').replace(/"/g, '""')}"`,
      `"${(c.email || '').replace(/"/g, '""')}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      `"${(c.province || '').replace(/"/g, '""')}"`,
      `"${c.date || ''}"`,
      `"${c.status || ''}"`,
      `"${c.category || ''}"`,
      `"${c.balance ?? 0}"`,
      `"${(c.note || '').replace(/"/g, '""')}"`,
      `"${c.createdAt || ''}"`,
    ]);

    // Prepend UTF-8 BOM (\uFEFF) to make sure Excel detects Khmer Unicode properly
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `khmer_customers_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  // Import data from JSON file
  async importFromJson(file: File): Promise<{ success: boolean; customerCount?: number; noteCount?: number; error?: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);

          if (parsed && Array.isArray(parsed.customers)) {
            this.saveCustomers(parsed.customers);
            if (Array.isArray(parsed.notes)) {
              this.saveNotes(parsed.notes);
            }
            resolve({
              success: true,
              customerCount: parsed.customers.length,
              noteCount: Array.isArray(parsed.notes) ? parsed.notes.length : 0,
            });
          } else {
            resolve({ success: false, error: 'Invalid file format' });
          }
        } catch (err: any) {
          resolve({ success: false, error: err.message || 'JSON parse error' });
        }
      };
      reader.onerror = () => resolve({ success: false, error: 'Failed to read file' });
      reader.readAsText(file);
    });
  },

  // Reset to initial sample data
  resetToSampleData(): void {
    this.saveCustomers(INITIAL_CUSTOMERS);
    this.saveNotes(INITIAL_NOTES);
  },

  // Clear all local records
  clearAll(): void {
    localStorage.removeItem(CUSTOMERS_KEY);
    localStorage.removeItem(NOTES_KEY);
  },

  // Estimate storage usage in KB
  getStorageUsage(): string {
    try {
      let total = 0;
      for (const x in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
          total += (localStorage[x].length + x.length) * 2;
        }
      }
      return `${(total / 1024).toFixed(2)} KB`;
    } catch {
      return 'N/A';
    }
  },
};
