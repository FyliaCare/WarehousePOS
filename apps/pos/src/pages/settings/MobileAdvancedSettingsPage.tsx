/**
 * Mobile Settings Page (Security & Data)
 * PWA-optimized with light blue theme
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Database,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Monitor,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  LogOut,
  UserX,
  ChevronRight,
  X,
  Package,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// ============================================
// THEME CONFIGURATION - Light Blue
// ============================================
const theme = {
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  primary: '#2563eb',
  primaryLight: '#dbeafe',
  primaryDark: '#1d4ed8',
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  border: '#e2e8f0',
};

type SectionType = 'security' | 'sessions' | 'data' | 'danger';

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([10, 50, 10]),
  warning: () => navigator.vibrate?.([20, 30, 20, 30, 20]),
};

// ============================================
// SECTION CARD COMPONENT
// ============================================
interface SectionCardProps {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
  onClick: () => void;
  danger?: boolean;
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, description, onClick, danger }: SectionCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => { haptic.light(); onClick(); }}
      className="w-full flex items-center gap-3 p-3.5 rounded-xl text-left transition-all active:bg-slate-50"
      style={{ backgroundColor: theme.surface, border: `1px solid ${danger ? '#fecaca' : theme.border}` }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold" style={{ color: danger ? theme.danger : theme.textPrimary }}>{title}</p>
        <p className="text-xs" style={{ color: theme.textMuted }}>{description}</p>
      </div>
      <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />
    </motion.button>
  );
}

// ============================================
// BOTTOM SHEET COMPONENT
// ============================================
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-h-[85vh] rounded-t-2xl overflow-hidden"
        style={{ backgroundColor: theme.surface }}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-12 h-1 rounded-full bg-slate-300" />
        </div>
        <div className="flex items-center justify-between px-4 pb-3">
          <h3 className="text-lg font-bold" style={{ color: theme.textPrimary }}>{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: theme.surfaceLight }}
          >
            <X className="w-4 h-4" style={{ color: theme.textSecondary }} />
          </button>
        </div>
        <div className="px-4 pb-8 overflow-y-auto max-h-[70vh]">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  icon: any;
  label: string;
  value: string | number;
  color: string;
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div 
      className="p-3 rounded-xl text-center"
      style={{ backgroundColor: theme.surfaceLight }}
    >
      <div 
        className="w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <p className="text-lg font-bold" style={{ color: theme.textPrimary }}>{value}</p>
      <p className="text-[10px]" style={{ color: theme.textMuted }}>{label}</p>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function MobileAdvancedSettingsPage() {
  const { store, signOut } = useAuthStore();
  const settings = useSettingsStore();
  const queryClient = useQueryClient();
  
  // State
  const [activeSheet, setActiveSheet] = useState<SectionType | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch store stats
  const { data: storeStats } = useQuery({
    queryKey: ['store-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return { products: 0, sales: 0, customers: 0 };
      const [products, sales, customers] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact' }).eq('store_id', store.id),
        supabase.from('sales').select('id', { count: 'exact' }).eq('store_id', store.id),
        supabase.from('customers').select('id', { count: 'exact' }).eq('store_id', store.id),
      ]);
      return {
        products: products.count || 0,
        sales: sales.count || 0,
        customers: customers.count || 0,
      };
    },
    enabled: !!store?.id,
  });

  // Mock sessions
  const sessions = [
    { id: '1', device: 'desktop', name: 'Chrome on Windows', location: 'Accra, Ghana', current: true },
    { id: '2', device: 'mobile', name: 'Safari on iPhone', location: 'Accra, Ghana', current: false },
  ];

  // Handlers
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter current password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different');
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.currentPassword,
      });

      if (signInError) {
        toast.error('Current password is incorrect');
        setIsChangingPassword(false);
        return;
      }

      // Update to new password
      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;
      
      haptic.success();
      toast.success('Password updated');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSheet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearCache = () => {
    haptic.medium();
    localStorage.removeItem('warehousepos-settings');
    queryClient.clear();
    toast.success('Cache cleared');
  };

  const handleRevokeSession = (_sessionId: string) => {
    haptic.medium();
    toast.success('Session revoked');
  };

  const handleRevokeAllSessions = async () => {
    haptic.warning();
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('All sessions signed out');
      setTimeout(() => signOut(), 1500);
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!store?.id) return;
    
    haptic.warning();
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('store_id', store.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      haptic.success();
      toast.success('All products deleted');
      setActiveSheet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete products');
    }
  };

  const handleClearSales = async () => {
    if (!store?.id) return;
    
    haptic.warning();
    try {
      // First delete sale items
      const { data: sales } = await supabase
        .from('sales')
        .select('id')
        .eq('store_id', store.id);

      if (sales && sales.length > 0) {
        const saleIds = sales.map(o => o.id);
        await supabase
          .from('sale_items')
          .delete()
          .in('sale_id', saleIds);
      }

      // Then delete sales
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('store_id', store.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      haptic.success();
      toast.success('Sales history cleared');
      setActiveSheet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear sales');
    }
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Type the exact confirmation text');
      return;
    }
    toast.error('Account deletion requires contacting support');
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  // ============================================
  // RENDER SHEETS
  // ============================================
  const renderSecuritySheet = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase" style={{ color: theme.textMuted }}>Change Password</p>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Current password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full px-4 py-3 rounded-xl text-sm"
            style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="w-4 h-4" style={{ color: theme.textMuted }} /> : <Eye className="w-4 h-4" style={{ color: theme.textMuted }} />}
          </button>
        </div>
        <input
          type="password"
          placeholder="New password (min 8 chars)"
          value={passwordForm.newPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        <button
          onClick={handlePasswordChange}
          disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: theme.primary }}
        >
          {isChangingPassword ? 'Updating...' : 'Update Password'}
        </button>
      </div>

      <div className="pt-4">
        <p className="text-xs font-bold uppercase mb-3" style={{ color: theme.textMuted }}>Two-Factor Auth</p>
        <div 
          className="flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: '#fef3c7' }}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold" style={{ color: theme.textPrimary }}>2FA Not Enabled</p>
            <p className="text-xs" style={{ color: theme.textMuted }}>Add extra security</p>
          </div>
          <button
            onClick={() => toast.info('2FA setup coming soon!')}
            className="px-3 py-1.5 rounded-lg text-xs font-bold"
            style={{ backgroundColor: theme.warning, color: 'white' }}
          >
            Enable
          </button>
        </div>
      </div>
    </div>
  );

  const renderSessionsSheet = () => (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: theme.textSecondary }}>
        Devices currently logged into your account:
      </p>
      <div className="space-y-3">
        {sessions.map((session) => (
          <div 
            key={session.id}
            className={`flex items-center gap-3 p-3 rounded-xl ${session.current ? 'ring-2 ring-blue-500' : ''}`}
            style={{ backgroundColor: theme.surfaceLight }}
          >
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: session.device === 'mobile' ? '#dbeafe' : '#e2e8f0' }}
            >
              {session.device === 'mobile' ? (
                <Smartphone className="w-5 h-5 text-blue-600" />
              ) : (
                <Monitor className="w-5 h-5 text-slate-600" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium flex items-center gap-2" style={{ color: theme.textPrimary }}>
                {session.name}
                {session.current && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-600 text-white">Current</span>
                )}
              </p>
              <p className="text-xs" style={{ color: theme.textMuted }}>{session.location}</p>
            </div>
            {!session.current && (
              <button
                onClick={() => handleRevokeSession(session.id)}
                className="px-2 py-1 rounded text-xs font-medium"
                style={{ color: theme.danger }}
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        onClick={handleRevokeAllSessions}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold"
        style={{ backgroundColor: '#fee2e2', color: theme.danger }}
      >
        <LogOut className="w-4 h-4" />
        Sign Out All Devices
      </button>
    </div>
  );

  const renderDataSheet = () => (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase" style={{ color: theme.textMuted }}>Storage Overview</p>
      <div className="grid grid-cols-3 gap-2">
        <StatCard icon={Package} label="Products" value={storeStats?.products || 0} color={theme.primary} />
        <StatCard icon={ShoppingCart} label="Sales" value={storeStats?.sales || 0} color={theme.success} />
        <StatCard icon={Users} label="Customers" value={storeStats?.customers || 0} color="#8b5cf6" />
      </div>

      <div className="p-3 rounded-xl" style={{ backgroundColor: theme.surfaceLight }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs" style={{ color: theme.textMuted }}>Estimated Storage</span>
          <span className="text-xs font-bold" style={{ color: theme.textPrimary }}>
            ~{((storeStats?.products || 0) * 0.002 + (storeStats?.sales || 0) * 0.001 + (storeStats?.customers || 0) * 0.0005).toFixed(2)} MB
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden bg-slate-200">
          <div 
            className="h-full rounded-full" 
            style={{ 
              backgroundColor: theme.primary,
              width: `${Math.min(((storeStats?.products || 0) + (storeStats?.sales || 0) + (storeStats?.customers || 0)) / 100, 100)}%` 
            }} 
          />
        </div>
      </div>

      <div className="space-y-2">
        <button
          onClick={handleClearCache}
          className="w-full flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: theme.surfaceLight }}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center">
            <RefreshCw className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Clear Cache</p>
            <p className="text-[11px]" style={{ color: theme.textMuted }}>Remove temporary data</p>
          </div>
        </button>
        <button
          onClick={() => { settings.resetSettings(); haptic.success(); toast.success('Settings reset'); }}
          className="w-full flex items-center gap-3 p-3 rounded-xl"
          style={{ backgroundColor: theme.surfaceLight }}
        >
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <RotateCcw className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>Reset Settings</p>
            <p className="text-[11px]" style={{ color: theme.textMuted }}>Restore defaults</p>
          </div>
        </button>
      </div>
    </div>
  );

  const renderDangerSheet = () => (
    <div className="space-y-3">
      <div 
        className="p-4 rounded-xl"
        style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <AlertTriangle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-bold text-red-700">Warning: These actions are permanent</p>
        </div>
        
        <div className="space-y-2">
          <button
            onClick={handleDeleteAllProducts}
            disabled={!storeStats?.products}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white disabled:opacity-50"
            style={{ border: '1px solid #fecaca' }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-red-700 block">Delete All Products</span>
              <span className="text-[10px] text-red-500">{storeStats?.products || 0} products will be deleted</span>
            </div>
          </button>
          <button
            onClick={handleClearSales}
            disabled={!storeStats?.sales}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-white disabled:opacity-50"
            style={{ border: '1px solid #fecaca' }}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <div className="flex-1 text-left">
              <span className="text-sm font-medium text-red-700 block">Clear Sales History</span>
              <span className="text-[10px] text-red-500">{storeStats?.sales || 0} sales will be deleted</span>
            </div>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-600"
          >
            <UserX className="w-4 h-4 text-white" />
            <span className="text-sm font-bold text-white">Delete Account</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: theme.background }}>
      {/* Header */}
      <div 
        className="px-4 pt-4 pb-5"
        style={{ backgroundColor: theme.primary }}
      >
        <h1 className="text-xl font-bold text-white">Settings</h1>
        <p className="text-sm text-white/70">Security, sessions & data</p>
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-3">
        <p className="text-xs font-bold uppercase px-1" style={{ color: theme.textMuted }}>
          Account & Security
        </p>
        <SectionCard
          icon={Shield}
          iconBg={theme.primaryLight}
          iconColor={theme.primary}
          title="Security"
          description="Password & authentication"
          onClick={() => setActiveSheet('security')}
        />
        <SectionCard
          icon={Smartphone}
          iconBg="#dbeafe"
          iconColor="#2563eb"
          title="Active Sessions"
          description="Manage logged in devices"
          onClick={() => setActiveSheet('sessions')}
        />

        <p className="text-xs font-bold uppercase px-1 pt-3" style={{ color: theme.textMuted }}>
          Data & Storage
        </p>
        <SectionCard
          icon={Database}
          iconBg="#d1fae5"
          iconColor="#059669"
          title="Data Management"
          description="Storage & cleanup"
          onClick={() => setActiveSheet('data')}
        />

        <p className="text-xs font-bold uppercase px-1 pt-3" style={{ color: theme.danger }}>
          Danger Zone
        </p>
        <SectionCard
          icon={AlertTriangle}
          iconBg="#fee2e2"
          iconColor="#dc2626"
          title="Danger Zone"
          description="Destructive actions"
          onClick={() => setActiveSheet('danger')}
          danger
        />
      </div>

      {/* Bottom Sheets */}
      <AnimatePresence>
        <BottomSheet 
          isOpen={activeSheet === 'security'} 
          onClose={() => setActiveSheet(null)}
          title="Security"
        >
          {renderSecuritySheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'sessions'} 
          onClose={() => setActiveSheet(null)}
          title="Active Sessions"
        >
          {renderSessionsSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'data'} 
          onClose={() => setActiveSheet(null)}
          title="Data Management"
        >
          {renderDataSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'danger'} 
          onClose={() => setActiveSheet(null)}
          title="Danger Zone"
        >
          {renderDangerSheet()}
        </BottomSheet>
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm rounded-2xl p-5"
              style={{ backgroundColor: theme.surface }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: theme.textPrimary }}>Delete Account?</h3>
                  <p className="text-xs" style={{ color: theme.textMuted }}>This cannot be undone</p>
                </div>
              </div>
              <p className="text-sm mb-3" style={{ color: theme.textSecondary }}>
                Type <strong>DELETE MY ACCOUNT</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="w-full px-4 py-3 rounded-xl text-sm mb-4"
                style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(''); }}
                  className="flex-1 py-3 rounded-xl text-sm font-bold"
                  style={{ backgroundColor: theme.surfaceLight, color: theme.textSecondary }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ backgroundColor: theme.danger }}
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
