import type { ReactNode } from "react";

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <header className="space-y-4">
      {breadcrumbs}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{title}</h1>
          {description ? <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        {actions}
      </div>
    </header>
  );
}
