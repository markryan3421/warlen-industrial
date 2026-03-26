// components/custom-header.tsx
import React from 'react';

interface CustomHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  badgeText?: string;
  showUnderline?: boolean;
  underlineText?: string;
}

export const CustomHeader = ({ 
  icon, 
  title, 
  description, 
  className = '',
  badgeText,
  showUnderline = false,
  underlineText
}: CustomHeaderProps) => {
  return (
    <div className={`flex items-center gap-4 mb-4 ${className}`}>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
        <div className="h-6 w-6 text-primary-foreground">
          {icon}
        </div>
      </div>
      <div>
        {badgeText && (
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {badgeText}
          </p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          {title}
          {showUnderline && underlineText && (
            <span className="relative inline-block text-primary">
              {underlineText}
              <span className="absolute -bottom-1 left-0 h-[3px] w-full rounded-full bg-secondary" />
            </span>
          )}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>
    </div>
  );
};