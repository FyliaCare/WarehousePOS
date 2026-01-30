import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Phone, 
  LogOut, 
  Bell, 
  MapPin,
  Star,
  Package,
  ChevronRight,
  Bike,
  Shield,
  User,
  Settings,
} from 'lucide-react';
import { formatPhone } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { CountryCode } from '@warehousepos/types';

// Premium theme configuration
const themes = {
  GH: {
    primary: '#FFD000',
    primaryLight: '#FFF8E0',
    primaryMid: '#FFE566',
    primaryDark: '#D4A900',
    accent: '#1A1A1A',
    textOnPrimary: '#1A1400',
    flag: '🇬🇭',
  },
  NG: {
    primary: '#008751',
    primaryLight: '#E8F5EE',
    primaryMid: '#66B894',
    primaryDark: '#006B41',
    accent: '#FFFFFF',
    textOnPrimary: '#FFFFFF',
    flag: '🇳🇬',
  },
};

export function ProfilePage() {
  const navigate = useNavigate();
  const { rider, store, signOut } = useAuthStore();
  const country: CountryCode = (store as any)?.tenant?.country === 'NG' ? 'NG' : 'GH';
  const theme = themes[country];
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to sign out');
    } finally {
      setIsSigningOut(false);
    }
  };

  const initials = rider?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'RD';

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: theme.primaryLight }}>
      {/* Profile Header */}
      <div 
        className="px-5 py-8"
        style={{ backgroundColor: theme.primary }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold shadow-lg"
            style={{ 
              backgroundColor: 'white',
              color: theme.primary,
            }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <h1 
              className="text-2xl font-bold mb-0.5"
              style={{ color: theme.textOnPrimary }}
            >
              {rider?.name || 'Rider'}
            </h1>
            <p 
              className="text-sm opacity-80"
              style={{ color: theme.textOnPrimary }}
            >
              {store?.name || 'Store'}
            </p>
            <div 
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mt-2 text-xs font-medium"
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: theme.textOnPrimary,
              }}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              {(rider as any)?.average_rating?.toFixed(1) || '5.0'} Rating
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* Stats Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Package className="w-5 h-5" style={{ color: theme.primary }} />
            Your Stats
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <div 
              className="text-center p-3 rounded-xl"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <p 
                className="text-2xl font-bold"
                style={{ color: theme.primaryDark }}
              >
                {(rider as any)?.total_deliveries || 0}
              </p>
              <p className="text-xs text-zinc-500">Deliveries</p>
            </div>
            <div className="text-center p-3 bg-emerald-50 rounded-xl">
              <p className="text-2xl font-bold text-emerald-600">
                {(rider as any)?.average_rating?.toFixed(1) || '5.0'}
              </p>
              <p className="text-xs text-zinc-500">Rating</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <p className="text-2xl font-bold text-blue-600">
                {Math.round(((rider as any)?.average_rating || 5) * 20)}%
              </p>
              <p className="text-xs text-zinc-500">Success</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-zinc-100 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Phone className="w-5 h-5" style={{ color: theme.primaryDark }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Phone Number</p>
              <p className="font-medium text-zinc-900">
                {formatPhone(rider?.phone || '', country)}
              </p>
            </div>
          </div>
          <div className="p-4 flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: theme.primaryLight }}
            >
              <Bike className="w-5 h-5" style={{ color: theme.primaryDark }} />
            </div>
            <div className="flex-1">
              <p className="text-xs text-zinc-500">Vehicle</p>
              <p className="font-medium text-zinc-900">
                {(rider as any)?.vehicle_type || 'Motorcycle'}
              </p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <h2 className="font-semibold text-zinc-900 px-4 pt-4 pb-2 flex items-center gap-2">
            <Settings className="w-5 h-5" style={{ color: theme.primary }} />
            Settings
          </h2>
          
          <div className="divide-y divide-zinc-100">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-50">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Push Notifications</p>
                  <p className="text-xs text-zinc-500">Get notified for new orders</p>
                </div>
              </div>
              <button
                onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  notificationsEnabled ? '' : 'bg-zinc-200'
                }`}
                style={notificationsEnabled ? { backgroundColor: theme.primary } : {}}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-zinc-900">Location Sharing</p>
                  <p className="text-xs text-zinc-500">Share location while delivering</p>
                </div>
              </div>
              <button
                onClick={() => setLocationEnabled(!locationEnabled)}
                className={`w-12 h-7 rounded-full transition-colors relative ${
                  locationEnabled ? '' : 'bg-zinc-200'
                }`}
                style={locationEnabled ? { backgroundColor: theme.primary } : {}}
              >
                <span 
                  className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    locationEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-50">
                <Shield className="w-5 h-5 text-purple-600" />
              </div>
              <span className="font-medium text-zinc-900">Privacy & Security</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
          
          <button className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors border-t border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-zinc-100">
                <User className="w-5 h-5 text-zinc-600" />
              </div>
              <span className="font-medium text-zinc-900">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className="w-full p-4 rounded-2xl font-semibold flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
        >
          <LogOut className="w-5 h-5" />
          {isSigningOut ? 'Signing Out...' : 'Sign Out'}
        </button>

        {/* App Version */}
        <p className="text-center text-sm text-zinc-400 pb-4">
          WarehousePOS Delivery {theme.flag} v1.0.0
        </p>
      </div>
    </div>
  );
}
