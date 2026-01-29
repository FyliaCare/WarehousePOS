import { cn } from '@warehousepos/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
}

function Skeleton({
  className,
  variant = 'default',
  width,
  height,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-muted',
        variant === 'default' && 'rounded-md',
        variant === 'circular' && 'rounded-full',
        variant === 'text' && 'rounded h-4',
        className
      )}
      style={{
        width,
        height,
        ...style,
      }}
      {...props}
    />
  );
}

// Common skeleton patterns
function SkeletonCard() {
  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="space-y-2 flex-1">
          <Skeleton variant="text" className="w-1/2" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton variant="text" className="w-full" />
        <Skeleton variant="text" className="w-3/4" />
      </div>
    </div>
  );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex space-x-4 px-4 py-2">
        <Skeleton variant="text" className="w-1/4" />
        <Skeleton variant="text" className="w-1/4" />
        <Skeleton variant="text" className="w-1/4" />
        <Skeleton variant="text" className="w-1/4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4 px-4 py-3 border-b">
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
          <Skeleton variant="text" className="w-1/4" />
        </div>
      ))}
    </div>
  );
}

function SkeletonList({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton variant="circular" width={48} height={48} />
          <div className="space-y-2 flex-1">
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonList };
