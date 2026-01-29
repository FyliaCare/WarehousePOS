import { AlertCircle } from 'lucide-react';
import { Button } from '@warehousepos/ui';

export function StoreNotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-destructive/10 rounded-full mx-auto mb-6 flex items-center justify-center">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Store Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The store you're looking for doesn't exist or may have been disabled.
          Please check the URL and try again.
        </p>
        <a href="https://warehousepos.com">
          <Button>Visit WarehousePOS</Button>
        </a>
      </div>
    </div>
  );
}
