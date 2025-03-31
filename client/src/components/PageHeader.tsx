import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const PageHeader = ({ title, subtitle, icon, children, className }: PageHeaderProps) => {
  return (
    <div className={cn("mb-6 flex flex-col md:flex-row md:items-center md:justify-between", className)}>
      <div className="flex items-center gap-3">
        {icon && <div className="text-primary">{icon}</div>}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      {children && <div className="mt-4 md:mt-0">{children}</div>}
    </div>
  );
};

export default PageHeader;