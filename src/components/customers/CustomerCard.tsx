import React from 'react';
import {
  Phone,
  Send,
  MapPin,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  Copy,
} from 'lucide-react';
import { Customer } from '../../types/customer';
import { StatusBadge, CategoryBadge } from '../common/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';

interface CustomerCardProps {
  customer: Customer;
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onView,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const getInitials = (name: string) => {
    if (!name) return 'អ';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2);
  };

  const copyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(customer.phone);
    showToast(t.toasts.phoneCopied, 'info');
  };

  return (
    <div
      onClick={() => onView(customer)}
      className="bg-card text-foreground rounded-2xl border border-border p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-primary transition-all duration-200 cursor-pointer flex flex-col justify-between group active:scale-[0.99]"
    >
      <div>
        {/* Header: Avatar, Name, Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-secondary border border-border text-foreground font-bold flex items-center justify-center text-sm shrink-0 font-khmer shadow-xs">
              {getInitials(customer.name)}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-foreground font-khmer text-base group-hover:text-primary transition-colors truncate">
                {customer.name}
              </h4>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <StatusBadge status={customer.status} size="sm" />
                {customer.category && (
                  <CategoryBadge category={customer.category} size="sm" />
                )}
              </div>
            </div>
          </div>

          {customer.balance !== undefined && customer.balance > 0 && (
            <div className="text-right shrink-0">
              <span className="text-[10px] text-muted-foreground uppercase font-semibold font-khmer block">
                សមតុល្យ
              </span>
              <span className="text-xs font-mono font-bold text-foreground">
                ${customer.balance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* Quick Contact & Info */}
        <div className="mt-3.5 space-y-2 text-xs text-foreground">
          {/* Phone & Telegram buttons */}
          <div className="flex items-center flex-wrap gap-2 pt-1">
            <a
              href={`tel:${customer.phone.replace(/\s+/g, '')}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 font-mono font-bold hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all"
              title={t.customerList.callNow}
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span>{customer.phone}</span>
            </a>
            <button
              onClick={copyPhone}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 cursor-pointer transition-colors"
              title={t.customerList.copyPhone}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {customer.telegram && (
              <a
                href={`https://t.me/${customer.telegram.replace('@', '')}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted text-muted-foreground border border-border font-mono hover:bg-secondary active:scale-95 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span>{customer.telegram}</span>
              </a>
            )}
          </div>

          {/* Address */}
          <div className="flex items-start gap-1.5 pt-1">
            <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="font-khmer text-muted-foreground line-clamp-1">
              {customer.address} {customer.province ? `• ${customer.province}` : ''}
            </span>
          </div>

          {/* Note Excerpt */}
          {customer.note && (
            <div className="p-2.5 rounded-xl bg-muted border border-border font-khmer text-muted-foreground text-xs line-clamp-2 leading-relaxed">
              {customer.note}
            </div>
          )}
        </div>
      </div>

      {/* Footer Date & Actions */}
      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
        <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3 text-muted-foreground" />
          {customer.date}
        </span>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onView(customer)}
            className="p-2 sm:p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={t.common.view}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="p-2 sm:p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={t.common.edit}
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(customer)}
            className="p-2 sm:p-1.5 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:scale-95 transition-colors cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
            title={t.common.delete}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
