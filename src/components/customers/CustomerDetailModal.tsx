import React, { useState } from 'react';
import {
  Phone,
  Send,
  MapPin,
  Calendar,
  Edit2,
  Trash2,
  Copy,
  Plus,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { Customer } from '../../types/customer';
import { StatusBadge, CategoryBadge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { useCustomers } from '../../context/CustomerContext';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { addCustomerHistoryNote } = useCustomers();

  const [newHistoryText, setNewHistoryText] = useState('');
  const [isAddingHistory, setIsAddingHistory] = useState(false);

  if (!customer) return null;

  const getInitials = (name: string) => {
    if (!name) return 'អ';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast(t.toasts.phoneCopied, 'info');
  };

  const handleAddHistory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHistoryText.trim()) return;

    addCustomerHistoryNote(customer.id, newHistoryText.trim());
    setNewHistoryText('');
    setIsAddingHistory(false);
    showToast(t.toasts.noteAdded, 'success');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t.customerDetail.title}
      subtitle={`ID: ${customer.id}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4.5 rounded-2xl bg-card border border-border">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground font-bold flex items-center justify-center text-xl shrink-0 font-khmer shadow-xs">
              {getInitials(customer.customerName || customer.name)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl font-bold text-foreground font-khmer">
                  {customer.customerName || customer.name}
                </h3>
                <StatusBadge status={customer.status} size="sm" />
                {(customer.productCategory || customer.category) && (
                  <CategoryBadge category={(customer.productCategory || customer.category) as any} size="sm" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-2 font-mono">
                <Calendar className="w-3.5 h-3.5" />
                <span>{customer.date}</span>
                {customer.province && (
                  <>
                    <span>•</span>
                    <span className="font-khmer">{customer.province}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Ledger Debt Card */}
          {(customer.outstandingDebt !== undefined || customer.balance !== undefined) && (
            <div className="sm:text-right bg-amber-500/10 dark:bg-amber-500/5 p-3 sm:px-4 sm:py-2 rounded-xl border border-amber-500/30">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-900 dark:text-amber-400 font-khmer block">
                ប្រាក់ជំពាក់ / Outstanding Debt
              </span>
              <span className="text-xl font-mono font-extrabold text-amber-900 dark:text-amber-400">
                ${Number(customer.outstandingDebt ?? customer.balance ?? 0).toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Quick Contact Action Bar: 3 columns on mobile and desktop */}
        <div className="grid grid-cols-3 gap-2">
          {/* Direct Phone Call */}
          <a
            href={`tel:${customer.phone.replace(/\s+/g, '')}`}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-xl bg-primary hover:bg-[var(--primary-hover)] text-primary-foreground font-semibold text-xs transition-colors shadow-xs active:scale-95 text-center"
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span className="truncate max-w-full font-mono text-[11px] sm:text-xs">
              {customer.phone}
            </span>
          </a>

          {/* Telegram */}
          {customer.telegram ? (
            <a
              href={`https://t.me/${customer.telegram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-xl bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors border border-border font-mono active:scale-95 text-center"
            >
              <Send className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="truncate max-w-full text-[11px] sm:text-xs">
                {customer.telegram}
              </span>
            </a>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-xl bg-muted/40 text-muted-foreground text-xs border border-border font-khmer opacity-60 text-center">
              <Send className="w-4 h-4 opacity-40 shrink-0" />
              <span className="text-[10px] sm:text-xs truncate">គ្មាន TG</span>
            </div>
          )}

          {/* Copy Phone */}
          <button
            onClick={() => copyToClipboard(customer.phone)}
            className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-2.5 py-2.5 rounded-xl bg-card hover:bg-muted text-foreground font-semibold text-xs transition-colors border border-border font-khmer cursor-pointer active:scale-95 text-center"
          >
            <Copy className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">{t.customerList.copyPhone}</span>
          </button>
        </div>

        {/* Detailed Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Address */}
          <div className="p-3.5 rounded-xl bg-card border border-border">
            <span className="font-bold text-muted-foreground uppercase tracking-wider font-khmer block mb-1">
              {t.customerForm.address}
            </span>
            <div className="flex items-start gap-2 text-foreground font-khmer">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <span>
                {customer.address || '—'}
                {customer.province && (
                  <span className="block font-semibold text-muted-foreground mt-0.5">
                    {customer.province}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Email & Priority */}
          <div className="p-3.5 rounded-xl bg-card border border-border">
            <span className="font-bold text-muted-foreground uppercase tracking-wider font-khmer block mb-1">
              {t.customerForm.email} & {t.customerForm.priority}
            </span>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-foreground font-mono">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <span>{customer.email || '—'}</span>
              </div>
              {customer.priority && (
                <div className="text-[11px] font-semibold text-muted-foreground font-khmer">
                  អាទិភាព:{' '}
                  <span className="capitalize text-foreground">
                    {customer.priority}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Goods & Debt Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-card border border-border text-xs">
          <div>
            <span className="font-bold text-muted-foreground uppercase tracking-wider font-khmer block mb-0.5">
              {t.customerForm.amount}
            </span>
            <span className="font-mono font-bold text-foreground text-sm">
              {customer.amount ?? 0}
            </span>
          </div>
          <div>
            <span className="font-bold text-muted-foreground uppercase tracking-wider font-khmer block mb-0.5">
              {t.customerForm.priceOfGoods}
            </span>
            <span className="font-mono font-bold text-foreground text-sm">
              ${Number(customer.priceOfGoods ?? 0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="font-bold text-amber-900 dark:text-amber-400 uppercase tracking-wider font-khmer block mb-0.5">
              {t.customerForm.outstandingDebt}
            </span>
            <span className="font-mono font-bold text-amber-900 dark:text-amber-400 text-sm">
              ${Number(customer.outstandingDebt ?? customer.balance ?? 0).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Note / Description Section */}
        <div className="p-4 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 text-foreground font-bold text-xs font-khmer mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span>{t.customerForm.notes}</span>
          </div>
          <p className="text-sm text-foreground font-khmer leading-relaxed whitespace-pre-wrap">
            {customer.notes || customer.note || 'មិនទាន់មានកំណត់ចំណាំពិស្ដារនៅឡើយទេ។'}
          </p>
        </div>

        {/* Timeline / Interaction History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-khmer">
              {t.customerDetail.historyTitle}
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsAddingHistory(!isAddingHistory)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="text-xs text-primary"
            >
              {t.customerDetail.addHistoryNote}
            </Button>
          </div>

          {/* Add History Form */}
          {isAddingHistory && (
            <form onSubmit={handleAddHistory} className="space-y-2 p-3 rounded-xl bg-card border border-border animate-fade-in">
              <textarea
                rows={2}
                value={newHistoryText}
                onChange={(e) => setNewHistoryText(e.target.value)}
                placeholder={t.customerDetail.addHistoryPlaceholder}
                className="w-full p-2.5 text-xs bg-background border border-border rounded-lg outline-none font-khmer focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  type="button"
                  onClick={() => setIsAddingHistory(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button size="sm" type="submit">
                  {t.common.save}
                </Button>
              </div>
            </form>
          )}

          {/* Timeline Items List */}
          <div className="space-y-2.5">
            {customer.history && customer.history.length > 0 ? (
              customer.history.map((hist) => (
                <div
                  key={hist.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
                >
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground font-khmer leading-relaxed">
                      {hist.content}
                    </p>
                    <span className="text-[10px] text-muted-foreground font-mono mt-1 block">
                      {new Date(hist.createdAt).toLocaleString('km-KH', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-2 font-khmer">
                មិនទាន់មានប្រវត្តិកត់ត្រាបន្ថែមនៅឡើយទេ
              </p>
            )}
          </div>
        </div>

        {/* Timestamps Info */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border pt-3 font-mono">
          <span>
            {t.customerDetail.createdAt}:{' '}
            {new Date(customer.createdAt).toLocaleDateString('km-KH')}
          </span>
          <span>
            {t.customerDetail.updatedAt}:{' '}
            {new Date(customer.updatedAt).toLocaleDateString('km-KH')}
          </span>
        </div>

        {/* Action Buttons: Edit, Delete, Close */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(customer)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {t.common.delete}
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              {t.common.close}
            </Button>
            <Button
              size="sm"
              onClick={() => onEdit(customer)}
              leftIcon={<Edit2 className="w-4 h-4" />}
            >
              {t.common.edit}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
