import React from 'react';
import { CustomerStatus, CustomerCategory } from '../../types/customer';
import { useLanguage } from '../../context/LanguageContext';

interface StatusBadgeProps {
  status: CustomerStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const { t } = useLanguage();

  const styles = {
    active: 'bg-primary text-primary-foreground border-primary shadow-2xs',
    pending: 'bg-[var(--warning)]/15 text-[var(--warning)] border-[var(--warning)]/30 font-medium',
    debt: 'bg-[var(--destructive)]/15 text-[var(--destructive)] border-[var(--destructive)]/30 font-medium',
    completed: 'bg-[var(--success)]/15 text-[var(--success)] border-[var(--success)]/30 font-medium',
    inactive: 'bg-muted text-muted-foreground border-border',
  };

  const dots = {
    active: 'bg-primary-foreground animate-pulse',
    pending: 'bg-[var(--warning)]',
    debt: 'bg-[var(--destructive)]',
    completed: 'bg-[var(--success)]',
    inactive: 'bg-muted-foreground',
  };

  const label = t.status[status] || status;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors font-khmer ${
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      } ${styles[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dots[status]}`} />
      <span>{label}</span>
    </span>
  );
};

interface CategoryBadgeProps {
  category?: CustomerCategory;
  size?: 'sm' | 'md';
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category, size = 'md' }) => {
  const { t } = useLanguage();

  if (!category) return null;

  const styles = {
    vip: 'bg-accent text-accent-foreground border-accent font-semibold shadow-2xs',
    wholesale: 'bg-primary text-primary-foreground border-primary shadow-2xs',
    retail: 'bg-secondary text-secondary-foreground border-border',
    service: 'bg-muted text-foreground border-border',
    online: 'bg-accent/15 text-accent border-accent/30 font-medium',
    general: 'bg-card text-muted-foreground border-border',
  };

  const label = t.categories[category] || category;

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border font-khmer ${
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs'
      } ${styles[category] || styles.general}`}
    >
      {label}
    </span>
  );
};
