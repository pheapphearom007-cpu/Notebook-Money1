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

interface CustomerTableProps {
  customers: Customer[];
  onView: (customer: Customer) => void;
  onEdit: (customer: Customer) => void;
  onDelete: (customer: Customer) => void;
}

export const CustomerTable: React.FC<CustomerTableProps> = ({
  customers,
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

  const copyToClipboard = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    showToast(t.toasts.phoneCopied, 'info');
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted text-[11px] font-bold text-foreground uppercase tracking-wider font-khmer">
            <th className="py-3.5 px-4 sm:px-6">{t.customerList.customerColumn}</th>
            <th className="py-3.5 px-4">{t.customerList.contactColumn}</th>
            <th className="py-3.5 px-4">{t.customerList.addressColumn}</th>
            <th className="py-3.5 px-4">{t.customerList.dateColumn}</th>
            <th className="py-3.5 px-4">{t.customerList.statusColumn}</th>
            <th className="py-3.5 px-4 min-w-[200px]">{t.customerList.noteColumn}</th>
            <th className="py-3.5 px-4 sm:px-6 text-right">{t.customerList.actionsColumn}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border text-sm">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              onClick={() => onView(customer)}
              className="hover:bg-muted transition-colors cursor-pointer group"
            >
              {/* Customer Name & Avatar */}
              <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-foreground font-bold flex items-center justify-center text-sm shrink-0 font-khmer shadow-xs">
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground font-khmer group-hover:text-primary transition-colors">
                      {customer.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {customer.category && (
                        <CategoryBadge category={customer.category} size="sm" />
                      )}
                      {customer.balance !== undefined && customer.balance > 0 && (
                        <span className="text-[11px] font-mono text-foreground font-semibold">
                          ${customer.balance.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Contact: Phone & Telegram */}
              <td className="py-4 px-4 whitespace-nowrap">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`tel:${customer.phone.replace(/\s+/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-mono text-foreground hover:text-primary flex items-center gap-1 text-xs"
                      title={t.customerList.callNow}
                    >
                      <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{customer.phone}</span>
                    </a>
                    <button
                      onClick={(e) => copyToClipboard(customer.phone, e)}
                      className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={t.customerList.copyPhone}
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  {customer.telegram && (
                    <a
                      href={`https://t.me/${customer.telegram.replace('@', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:underline font-mono"
                      title={t.customerList.openTelegram}
                    >
                      <Send className="w-3 h-3" />
                      <span>{customer.telegram}</span>
                    </a>
                  )}
                </div>
              </td>

              {/* Address */}
              <td className="py-4 px-4">
                <div className="flex items-start gap-1.5 max-w-[200px]">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground font-khmer line-clamp-2">
                    {customer.address}
                    {customer.province && (
                      <span className="block text-foreground font-semibold mt-0.5">
                        {customer.province}
                      </span>
                    )}
                  </span>
                </div>
              </td>

              {/* Date */}
              <td className="py-4 px-4 whitespace-nowrap">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>{customer.date}</span>
                </div>
              </td>

              {/* Status */}
              <td className="py-4 px-4 whitespace-nowrap">
                <StatusBadge status={customer.status} />
              </td>

              {/* Short Note Preview */}
              <td className="py-4 px-4">
                <p className="text-xs text-muted-foreground font-khmer line-clamp-2 max-w-xs leading-relaxed">
                  {customer.note || '—'}
                </p>
              </td>

              {/* Actions */}
              <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                <div
                  className="flex items-center justify-end gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onView(customer)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title={t.common.view}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEdit(customer)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title={t.common.edit}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(customer)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors cursor-pointer"
                    title={t.common.delete}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
