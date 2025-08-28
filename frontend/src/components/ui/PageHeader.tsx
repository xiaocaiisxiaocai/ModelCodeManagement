import React from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import type { BreadcrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, subtitle, action, breadcrumbs }) => {
  return (
    <div className="mb-4 lg:mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 lg:gap-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl lg:text-2xl font-bold text-gray-800 truncate">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-gray-500 break-words">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
};

export { PageHeader };

