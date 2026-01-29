import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@warehousepos/ui';

export function NotFoundPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-foreground mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="flex gap-4 justify-center">
        <Link to="/">
          <Button className="gap-2">
            <Home className="w-4 h-4" />
            Go Home
          </Button>
        </Link>
        <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
