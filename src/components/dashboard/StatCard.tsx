import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconTextColor: string;
  trendText?: string;
  trendPositive?: boolean;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor,
  iconTextColor,
  trendText,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`relative bg-card text-foreground rounded-2xl p-3.5 sm:p-5 border border-border shadow-xs hover:shadow-md transition-all duration-200 active:scale-[0.98] ${
        onClick ? 'cursor-pointer hover:border-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground font-khmer truncate">
            {title}
          </p>
          <h3 className="text-xl sm:text-3xl font-black text-foreground mt-0.5 sm:mt-1 tracking-tight font-mono">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 font-khmer truncate">
              {subtitle}
            </p>
          )}
          {trendText && (
            <span className="inline-flex items-center text-[10px] sm:text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-md font-khmer bg-secondary text-secondary-foreground border border-border truncate max-w-full">
              {trendText}
            </span>
          )}
        </div>
        <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0 border border-border [&>svg]:w-4.5 [&>svg]:h-4.5 sm:[&>svg]:w-6 sm:[&>svg]:h-6`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
