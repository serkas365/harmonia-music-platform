import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, subtitle, icon, children, className }: PageHeaderProps) => {
  return (
    <div className={cn('flex flex-col space-y-2', className)}>
      <div className="flex items-center space-x-3">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div>{children}</div>}
    </div>
  );
};

export default PageHeader;