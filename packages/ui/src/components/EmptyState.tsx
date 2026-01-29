import * as React from 'react';
import { cn } from '@warehousepos/utils';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  } | React.ReactNode;
  className?: string;
}

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const isActionObject = action && typeof action === 'object' && 'label' in action && 'onClick' in action;
  
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {icon && (
        <div className="mb-4 rounded-full bg-muted p-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        isActionObject ? (
          <Button onClick={(action as { label: string; onClick: () => void }).onClick} className="mt-6">
            {(action as { label: string; onClick: () => void }).label}
          </Button>
        ) : (
          <div className="mt-6">{action as React.ReactNode}</div>
        )
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
function NoProducts({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      }
      title="No products yet"
      description="Start by adding your first product to your inventory."
      action={onAdd ? { label: 'Add Product', onClick: onAdd } : undefined}
    />
  );
}

function NoCustomers({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      }
      title="No customers yet"
      description="Your customers will appear here after their first purchase."
      action={onAdd ? { label: 'Add Customer', onClick: onAdd } : undefined}
    />
  );
}

function NoOrders() {
  return (
    <EmptyState
      icon={
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      }
      title="No orders yet"
      description="Orders from your online store will appear here."
    />
  );
}

function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      }
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search.`}
    />
  );
}

export { EmptyState, NoProducts, NoCustomers, NoOrders, NoSearchResults };
