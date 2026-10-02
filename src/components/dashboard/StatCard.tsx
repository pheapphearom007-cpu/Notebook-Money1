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
      className={`relative bg-card text-foreground rounded-2xl p-5 border border-border shadow-xs hover:shadow-md transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-primary' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-khmer">
            {title}
          </p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1 tracking-tight">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1 font-khmer">
              {subtitle}
            </p>
          )}
          {trendText && (
            <span className="inline-flex items-center text-xs font-semibold mt-2 px-2 py-0.5 rounded-md font-khmer bg-secondary text-secondary-foreground border border-border">
              {trendText}
            </span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0 border border-border`}>
          {icon}
        </div>
      </div>
    </div>
  );
};
