import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import { Customer, generateUUID, isValidUUID } from '../types/customer';
import { GeneralNote } from '../types/note';

export interface CustomerRealtimeCallbacks {
  onInsert: (customer: Customer) => void;
  onUpdate: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onError?: (error: any) => void;
}

export interface NoteRealtimeCallbacks {
  onInsert: (note: GeneralNote) => void;
  onUpdate: (note: GeneralNote) => void;
  onDelete: (id: string) => void;
  onError?: (error: any) => void;
}

export const CustomerService = {
  // Map database row to TypeScript Customer object
  mapRowToCustomer(row: any): Customer {
    const rawDebt = row.outstanding_debt !== null && row.outstanding_debt !== undefined
      ? Number(row.outstanding_debt)
      : (row.balance !== null && row.balance !== undefined ? Number(row.balance) : 0);

    const name = row.customer_name || row.name || '';
    const category = row.product_category || row.category || 'general';
    const noteText = row.notes || row.note || '';

    return {
      id: row.id,
      userId: row.user_id,
      customerName: name,
      name,
      productCategory: category,
      category,
      amount: row.amount !== null && row.amount !== undefined ? Number(row.amount) : 0,
      priceOfGoods: row.price_of_goods !== null && row.price_of_goods !== undefined ? Number(row.price_of_goods) : 0,
      outstandingDebt: rawDebt,
      balance: rawDebt,
      notes: noteText,
      note: noteText,
      phone: row.phone || '',
      address: row.address || '',
      province: row.province || '',
      date: row.date || new Date().toISOString().split('T')[0],
      status: row.status || 'active',
      priority: row.priority || 'medium',
      email: row.email || undefined,
      telegram: row.telegram || undefined,
      currency: row.currency || 'USD',
      history: Array.isArray(row.history) ? row.history : [],
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  },

  // Map TypeScript Customer to PostgreSQL database row
  mapCustomerToRow(customer: Partial<Customer>, userId: string): any {
    // Ensure ID is a valid UUID
    const id = customer.id && isValidUUID(customer.id) ? customer.id : generateUUID();
    const name = (customer.customerName || customer.name || '').trim();
    const category = customer.productCategory || customer.category || 'general';
    const notes = (customer.notes || customer.note || '').trim();
    const debt = Number(customer.outstandingDebt ?? customer.balance ?? 0);

    return {
      id,
      user_id: userId,
      customer_name: name,
      product_category: category,
      amount: customer.amount !== undefined && !isNaN(Number(customer.amount)) ? Number(customer.amount) : 0,
      price_of_goods: customer.priceOfGoods !== undefined && !isNaN(Number(customer.priceOfGoods)) ? Number(customer.priceOfGoods) : 0,
      outstanding_debt: !isNaN(debt) ? debt : 0,
      notes,
      phone: (customer.phone || '').trim(),
      address: (customer.address || '').trim(),
      province: (customer.province || '').trim(),
      date: customer.date || new Date().toISOString().split('T')[0],
      status: customer.status || 'active',
      priority: customer.priority || 'medium',
      email: customer.email?.trim() || null,
      telegram: customer.telegram?.trim() || null,
      currency: customer.currency || 'USD',
      history: customer.history || [],
      created_at: customer.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  mapRowToNote(row: any): GeneralNote {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title || '',
      content: row.content || '',
      category: row.category,
      customerId: row.customer_id,
      customerName: row.customer_name,
      color: row.color || 'yellow',
      isPinned: Boolean(row.is_pinned),
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || new Date().toISOString(),
    };
  },

  mapNoteToRow(note: Partial<GeneralNote>, userId: string): any {
    const id = note.id && isValidUUID(note.id) ? note.id : generateUUID();
    const customerId = note.customerId && isValidUUID(note.customerId) ? note.customerId : null;

    return {
      id,
      user_id: userId,
      title: (note.title || '').trim(),
      content: (note.content || '').trim(),
      category: note.category || null,
      customer_id: customerId,
      customer_name: note.customerName || null,
      color: note.color || 'yellow',
      is_pinned: Boolean(note.isPinned),
      created_at: note.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  },

  // ============================================================================
  // READ (Fetch only current user's customer records)
  // ============================================================================
  async getCustomers(userId: string): Promise<Customer[]> {
    if (!isSupabaseConfigured()) {
      return [];
    }

    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('CustomerService.getCustomers error:', error);
      throw new Error(`Failed to load customers from cloud: ${error.message}`);
    }

    return (data || []).map(this.mapRowToCustomer);
  },

  // ============================================================================
  // CREATE (Add customer, attach user_id, save to PostgreSQL)
  // ============================================================================
  async createCustomer(
    userId: string,
    customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Customer> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Cloud is not configured. Please connect Supabase in Settings.');
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const row = this.mapCustomerToRow(customerData, userId);

    const { data, error } = await supabase
      .from('customers')
      .insert(row)
      .select()
      .single();

    if (error) {
      console.error('CustomerService.createCustomer error:', error);
      throw new Error(`Failed to save customer to cloud: ${error.message}`);
    }

    return this.mapRowToCustomer(data);
  },

  // ============================================================================
  // UPDATE (Update record in PostgreSQL, trigger updates updated_at)
  // ============================================================================
  async updateCustomer(
    userId: string,
    id: string,
    data: Partial<Customer>
  ): Promise<Customer> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Cloud is not configured');
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const updatePayload: Record<string, any> = {};

    if (data.customerName !== undefined || data.name !== undefined) {
      updatePayload.customer_name = (data.customerName || data.name || '').trim();
    }
    if (data.productCategory !== undefined || data.category !== undefined) {
      updatePayload.product_category = data.productCategory || data.category || 'general';
    }
    if (data.amount !== undefined) {
      updatePayload.amount = Number(data.amount) || 0;
    }
    if (data.priceOfGoods !== undefined) {
      updatePayload.price_of_goods = Number(data.priceOfGoods) || 0;
    }
    if (data.outstandingDebt !== undefined || data.balance !== undefined) {
      const debt = Number(data.outstandingDebt ?? data.balance ?? 0);
      updatePayload.outstanding_debt = !isNaN(debt) ? debt : 0;
    }
    if (data.notes !== undefined || data.note !== undefined) {
      updatePayload.notes = (data.notes || data.note || '').trim();
    }
    if (data.phone !== undefined) updatePayload.phone = data.phone.trim();
    if (data.address !== undefined) updatePayload.address = data.address.trim();
    if (data.province !== undefined) updatePayload.province = data.province.trim();
    if (data.date !== undefined) updatePayload.date = data.date;
    if (data.status !== undefined) updatePayload.status = data.status;
    if (data.priority !== undefined) updatePayload.priority = data.priority;
    if (data.email !== undefined) updatePayload.email = data.email.trim() || null;
    if (data.telegram !== undefined) updatePayload.telegram = data.telegram.trim() || null;
    if (data.currency !== undefined) updatePayload.currency = data.currency;
    if (data.history !== undefined) updatePayload.history = data.history;

    // updated_at is also enforced by DB trigger, but we update timestamp here too
    updatePayload.updated_at = new Date().toISOString();

    const { data: updated, error } = await supabase
      .from('customers')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('CustomerService.updateCustomer error:', error);
      throw new Error(`Failed to update customer: ${error.message}`);
    }

    return this.mapRowToCustomer(updated);
  },

  // ============================================================================
  // DELETE (Delete record owned by current user)
  // ============================================================================
  async deleteCustomer(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Cloud is not configured');
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('CustomerService.deleteCustomer error:', error);
      throw new Error(`Failed to delete customer: ${error.message}`);
    }
  },

  // ============================================================================
  // REALTIME SYNCHRONIZATION (Listen for INSERT, UPDATE, DELETE)
  // ============================================================================
  subscribeToCustomers(
    userId: string,
    callbacks: CustomerRealtimeCallbacks
  ): () => void {
    if (!isSupabaseConfigured()) {
      return () => {};
    }

    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    // Channel name uniquely identified by user
    const channelName = `realtime-customers-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callbacks.onInsert(CustomerService.mapRowToCustomer(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'customers',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new) {
            callbacks.onUpdate(CustomerService.mapRowToCustomer(payload.new));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'customers',
        },
        (payload) => {
          // If replica identity full, payload.old.id and user_id are present
          const deletedId = payload.old?.id;
          const oldUserId = payload.old?.user_id;

          // Only process if it belongs to this user or user_id wasn't captured in partial replica
          if (deletedId && (!oldUserId || oldUserId === userId)) {
            callbacks.onDelete(deletedId);
          }
        }
      )
      .subscribe((status, err) => {
        if (err && callbacks.onError) {
          callbacks.onError(err);
        }
      });

    // Cleanup function: remove channel when component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ============================================================================
  // NOTES CRUD & REALTIME
  // ============================================================================
  async getNotes(userId: string): Promise<GeneralNote[]> {
    if (!isSupabaseConfigured()) return [];
    const supabase = getSupabaseClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('CustomerService.getNotes error:', error);
      return [];
    }
    return (data || []).map(this.mapRowToNote);
  },

  async createNote(
    userId: string,
    noteData: Omit<GeneralNote, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GeneralNote> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Cloud is not configured');
    }
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    const row = this.mapNoteToRow(noteData, userId);
    const { data, error } = await supabase
      .from('notes')
      .insert(row)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save note: ${error.message}`);
    }
    return this.mapRowToNote(data);
  },

  async updateNote(userId: string, id: string, data: Partial<GeneralNote>): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (data.title !== undefined) updatePayload.title = data.title.trim();
    if (data.content !== undefined) updatePayload.content = data.content.trim();
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.color !== undefined) updatePayload.color = data.color;
    if (data.isPinned !== undefined) updatePayload.is_pinned = data.isPinned;

    await supabase
      .from('notes')
      .update(updatePayload)
      .eq('id', id)
      .eq('user_id', userId);
  },

  async deleteNote(userId: string, id: string): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    await supabase.from('notes').delete().eq('id', id).eq('user_id', userId);
  },

  subscribeToNotes(userId: string, callbacks: NoteRealtimeCallbacks): () => void {
    if (!isSupabaseConfigured()) return () => {};
    const supabase = getSupabaseClient();
    if (!supabase) return () => {};

    const channelName = `realtime-notes-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName);

    channel
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        (p) => p.new && callbacks.onInsert(CustomerService.mapRowToNote(p.new))
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `user_id=eq.${userId}` },
        (p) => p.new && callbacks.onUpdate(CustomerService.mapRowToNote(p.new))
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notes' },
        (p) => p.old?.id && callbacks.onDelete(p.old.id)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  // ============================================================================
  // DATA MIGRATION HELPER (Migrates local / sample data to Cloud PostgreSQL)
  // ============================================================================
  async migrateLegacyDataToCloud(
    userId: string,
    legacyCustomers: Customer[],
    legacyNotes: GeneralNote[]
  ): Promise<{ customersMigrated: number; notesMigrated: number }> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase Cloud is not configured for migration.');
    }

    const supabase = getSupabaseClient();
    if (!supabase) throw new Error('Supabase client unavailable');

    let customersMigrated = 0;
    let notesMigrated = 0;

    // Migrate customers
    for (const cust of legacyCustomers) {
      try {
        const row = this.mapCustomerToRow(cust, userId);
        const { error } = await supabase.from('customers').upsert(row);
        if (!error) {
          customersMigrated++;
        } else {
          console.warn('Customer migration row notice:', error);
        }
      } catch (e) {
        console.warn('Customer migration row exception:', e);
      }
    }

    // Migrate notes
    for (const note of legacyNotes) {
      try {
        const row = this.mapNoteToRow(note, userId);
        const { error } = await supabase.from('notes').upsert(row);
        if (!error) {
          notesMigrated++;
        }
      } catch (e) {
        console.warn('Note migration row exception:', e);
      }
    }

    return { customersMigrated, notesMigrated };
  },

  // ============================================================================
  // DATA VALIDATION (Khmer & English friendly error checking)
  // ============================================================================
  validateCustomer(
    data: Partial<Customer>,
    isKhmer = true
  ): { isValid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    const name = (data.customerName || data.name || '').trim();
    if (!name) {
      errors.name = isKhmer ? 'សូមបញ្ចូលឈ្មោះអតិថិជន' : 'Customer name is required';
    }

    if (data.phone && data.phone.trim().length > 0 && data.phone.trim().length < 8) {
      errors.phone = isKhmer ? 'ទម្រង់លេខទូរស័ព្ទមិនត្រឹមត្រូវឡើយ' : 'Phone number is invalid';
    }

    if (data.amount !== undefined && data.amount !== null) {
      const amt = Number(data.amount);
      if (isNaN(amt) || amt < 0) {
        errors.amount = isKhmer
          ? 'ចំនួនទំនិញត្រូវតែជាលេខវិជ្ជមាន (>= 0)'
          : 'Amount must be a non-negative number';
      }
    }

    if (data.priceOfGoods !== undefined && data.priceOfGoods !== null) {
      const price = Number(data.priceOfGoods);
      if (isNaN(price) || price < 0) {
        errors.priceOfGoods = isKhmer
          ? 'តម្លៃទំនិញត្រូវតែជាលេខវិជ្ជមាន (>= 0)'
          : 'Price of goods must be a non-negative number';
      }
    }

    const debtVal = data.outstandingDebt !== undefined ? data.outstandingDebt : data.balance;
    if (debtVal !== undefined && debtVal !== null) {
      const debt = Number(debtVal);
      if (isNaN(debt) || debt < 0) {
        errors.outstandingDebt = isKhmer
          ? 'ទឹកប្រាក់ជំពាក់ត្រូវតែជាលេខវិជ្ជមាន (>= 0)'
          : 'Outstanding debt must be a non-negative number';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },
};
