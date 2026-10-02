import React from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction,
  actionIcon,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-2xl border-2 border-dashed border-border bg-card/60">
      <div className="p-4 rounded-2xl bg-muted shadow-2xs border border-border text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-foreground font-khmer">
        {title}
      </h3>
      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-khmer max-w-md leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <div className="mt-5">
          <Button
            size="sm"
            onClick={onAction}
            leftIcon={actionIcon}
          >
            {actionText}
          </Button>
        </div>
      )}
    </div>
  );
};
