import { Truck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export default function MobileDeliveriesPage() {
  const { tenant } = useAuthStore();
  const isNigeria = tenant?.country === 'NG';

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ 
        background: isNigeria 
          ? 'linear-gradient(135deg, #E8F5EE 0%, #FFFFFF 100%)' 
          : 'linear-gradient(135deg, #FFF9E0 0%, #FFFFFF 100%)' 
      }}
    >
      <div className="text-center max-w-md">
        <div 
          className="w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: isNigeria ? '#008751' : '#FFD000' }}
        >
          <Truck className="w-10 h-10" style={{ color: isNigeria ? '#FFFFFF' : '#1A1A1A' }} />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-3">Mobile Deliveries</h1>
        <p className="text-zinc-600 mb-6">
          Mobile delivery management is coming soon! Track and manage deliveries on the go.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all"
          style={{ 
            backgroundColor: isNigeria ? '#008751' : '#FFD000',
            color: isNigeria ? '#FFFFFF' : '#1A1A1A'
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
