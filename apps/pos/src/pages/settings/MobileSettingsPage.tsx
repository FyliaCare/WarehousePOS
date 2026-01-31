/**
 * Mobile Settings Page
 * PWA-optimized with light blue theme
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Store,
  Receipt,
  Bell,
  Palette,
  CreditCard,
  Moon,
  Sun,
  Monitor,
  ChevronRight,
  X,
  Settings2,
  Briefcase,
  Check,
  LogOut,
  Shield,
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
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

type SheetType = 'profile' | 'pos' | 'notifications' | 'appearance' | 'security' | 'deleteAccount' | null;

// Haptic feedback helper
const haptic = {
  light: () => navigator.vibrate?.(10),
  medium: () => navigator.vibrate?.(20),
  success: () => navigator.vibrate?.([10, 50, 10]),
};

// ============================================
// SETTINGS ROW COMPONENT
// ============================================
interface SettingsRowProps {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
  value?: string;
  showArrow?: boolean;
}

function SettingsRow({ icon: Icon, iconBg, iconColor, title, subtitle, onClick, value, showArrow = true }: SettingsRowProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => { haptic.light(); onClick(); }}
      className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all active:bg-slate-50"
      style={{ backgroundColor: theme.surface }}
    >
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{title}</p>
        {subtitle && <p className="text-xs truncate" style={{ color: theme.textMuted }}>{subtitle}</p>}
      </div>
      {value && <span className="text-sm" style={{ color: theme.textMuted }}>{value}</span>}
      {showArrow && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: theme.textMuted }} />}
    </motion.button>
  );
}

// ============================================
// TOGGLE ROW COMPONENT
// ============================================
interface ToggleRowProps {
  icon: any;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function ToggleRow({ icon: Icon, iconBg, iconColor, title, subtitle, checked, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: theme.surface }}>
      <div 
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: iconBg }}
      >
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: theme.textPrimary }}>{title}</p>
        {subtitle && <p className="text-xs" style={{ color: theme.textMuted }}>{subtitle}</p>}
      </div>
      <button
        onClick={() => { haptic.light(); onChange(!checked); }}
        className={`w-12 h-7 rounded-full p-0.5 transition-colors ${
          checked ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <motion.div
          layout
          className="w-6 h-6 rounded-full bg-white shadow-sm"
          style={{ marginLeft: checked ? 'auto' : 0 }}
        />
      </button>
    </div>
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
// MAIN COMPONENT
// ============================================
export default function MobileSettingsPage() {
  const navigate = useNavigate();
  const { user, store, signOut } = useAuthStore();
  const settings = useSettingsStore();
  
  const [activeSheet, setActiveSheet] = useState<SheetType>(null);
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    phone: user?.phone || '',
  });

  // Security state
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Password validation
  const passwordValidation = {
    minLength: passwordForm.newPassword.length >= 8,
    hasUppercase: /[A-Z]/.test(passwordForm.newPassword),
    hasLowercase: /[a-z]/.test(passwordForm.newPassword),
    hasNumber: /[0-9]/.test(passwordForm.newPassword),
    matches: passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword.length > 0,
  };

  const isPasswordValid = 
    passwordValidation.minLength && 
    passwordValidation.hasUppercase && 
    passwordValidation.hasLowercase && 
    passwordValidation.hasNumber &&
    passwordValidation.matches;

  // Theme labels
  const themeLabels: Record<string, string> = {
    light: 'Light',
    dark: 'Dark',
    system: 'System',
  };

  // Handle profile save
  const handleProfileSave = async () => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          first_name: profileForm.firstName,
          last_name: profileForm.lastName,
          phone: profileForm.phone,
        })
        .eq('id', user?.id);
      
      if (error) throw error;
      haptic.success();
      toast.success('Profile updated');
      setActiveSheet(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  // Handle sign out
  const handleSignOut = async () => {
    haptic.medium();
    await signOut();
    navigate('/login');
  };

  // Handle password change
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    
    if (!isPasswordValid) {
      toast.error('Please meet all password requirements');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Use edge function for secure password change with current password verification
      const { data, error } = await supabase.functions.invoke('change-password', {
        body: { 
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword 
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      haptic.success();
      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSheet(null);
    } catch (error: any) {
      // Handle specific error codes
      if (error.message?.includes('INVALID_CURRENT_PASSWORD') || error.message?.includes('incorrect')) {
        toast.error('Current password is incorrect');
      } else {
        toast.error(error.message || 'Failed to change password');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user?.id }
      });

      if (error) throw error;

      toast.success('Account deletion initiated');
      await signOut();
    } catch (error: any) {
      toast.error('Please contact support@warehousepos.com to delete your account');
      setActiveSheet(null);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // ============================================
  // RENDER SHEETS
  // ============================================
  const renderProfileSheet = () => (
    <div className="space-y-4">
      <div className="space-y-3">
        <input
          type="text"
          placeholder="First Name"
          value={profileForm.firstName}
          onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={profileForm.lastName}
          onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        <input
          type="email"
          placeholder="Email"
          value={user?.email || ''}
          disabled
          className="w-full px-4 py-3 rounded-xl text-sm opacity-60"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        <input
          type="tel"
          placeholder="Phone"
          value={profileForm.phone}
          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
      </div>
      <button
        onClick={handleProfileSave}
        className="w-full py-3 rounded-xl text-sm font-bold text-white"
        style={{ backgroundColor: theme.primary }}
      >
        Save Changes
      </button>
    </div>
  );

  const renderPOSSheet = () => (
    <div className="space-y-3">
      <ToggleRow
        icon={Receipt}
        iconBg={theme.primaryLight}
        iconColor={theme.primary}
        title="Quick Add"
        subtitle="Single tap to add items"
        checked={settings.quickAddEnabled}
        onChange={settings.setQuickAdd}
      />
      <ToggleRow
        icon={Bell}
        iconBg="#d1fae5"
        iconColor="#059669"
        title="Sound Effects"
        subtitle="Play sounds for actions"
        checked={settings.soundEnabled}
        onChange={settings.setSound}
      />
      <ToggleRow
        icon={Receipt}
        iconBg="#fef3c7"
        iconColor="#d97706"
        title="Auto Print Receipt"
        subtitle="Print after each sale"
        checked={settings.printReceipt}
        onChange={settings.setPrintReceipt}
      />
      <ToggleRow
        icon={Store}
        iconBg="#fee2e2"
        iconColor="#dc2626"
        title="Low Stock Warnings"
        subtitle="Show alerts for low stock"
        checked={settings.showStockWarnings}
        onChange={settings.setShowStockWarnings}
      />
    </div>
  );

  const renderNotificationsSheet = () => (
    <div className="space-y-3">
      <ToggleRow
        icon={Bell}
        iconBg={theme.primaryLight}
        iconColor={theme.primary}
        title="Low Stock Alerts"
        subtitle="Get notified when products are low"
        checked={true}
        onChange={() => {}}
      />
      <ToggleRow
        icon={Receipt}
        iconBg="#d1fae5"
        iconColor="#059669"
        title="New Orders"
        subtitle="Notifications for online orders"
        checked={true}
        onChange={() => {}}
      />
      <ToggleRow
        icon={CreditCard}
        iconBg="#fef3c7"
        iconColor="#d97706"
        title="Daily Reports"
        subtitle="Receive daily sales summary"
        checked={false}
        onChange={() => {}}
      />
    </div>
  );

  const renderAppearanceSheet = () => (
    <div className="space-y-4">
      <p className="text-xs font-bold uppercase" style={{ color: theme.textMuted }}>Theme</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { value: 'light', icon: Sun, label: 'Light' },
          { value: 'dark', icon: Moon, label: 'Dark' },
          { value: 'system', icon: Monitor, label: 'System' },
        ].map((themeOption) => (
          <button
            key={themeOption.value}
            onClick={() => { haptic.light(); settings.setTheme(themeOption.value as any); }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
              settings.theme === themeOption.value ? 'border-blue-500 bg-blue-50' : 'border-slate-200'
            }`}
          >
            <themeOption.icon className="w-5 h-5" style={{ color: settings.theme === themeOption.value ? theme.primary : theme.textMuted }} />
            <span className="text-xs font-medium" style={{ color: settings.theme === themeOption.value ? theme.primary : theme.textSecondary }}>
              {themeOption.label}
            </span>
            {settings.theme === themeOption.value && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ))}
      </div>

      <div className="pt-4">
        <p className="text-xs font-bold uppercase mb-3" style={{ color: theme.textMuted }}>Display</p>
        <ToggleRow
          icon={Palette}
          iconBg={theme.primaryLight}
          iconColor={theme.primary}
          title="Compact Mode"
          subtitle="Smaller spacing and fonts"
          checked={settings.compactMode}
          onChange={settings.setCompactMode}
        />
      </div>
    </div>
  );

  const renderSecuritySheet = () => (
    <div className="space-y-4">
      {/* Password Change */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase" style={{ color: theme.textMuted }}>Change Password</p>
        
        {/* Current Password */}
        <div className="relative">
          <input
            type={showCurrentPassword ? 'text' : 'password'}
            placeholder="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
            style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
          />
          <button
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showCurrentPassword ? <EyeOff className="w-5 h-5" style={{ color: theme.textMuted }} /> : <Eye className="w-5 h-5" style={{ color: theme.textMuted }} />}
          </button>
        </div>

        {/* New Password */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            className="w-full px-4 py-3 pr-12 rounded-xl text-sm"
            style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
          />
          <button
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
          >
            {showPassword ? <EyeOff className="w-5 h-5" style={{ color: theme.textMuted }} /> : <Eye className="w-5 h-5" style={{ color: theme.textMuted }} />}
          </button>
        </div>

        {/* Confirm Password */}
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Confirm Password"
          value={passwordForm.confirmPassword}
          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
        
        {/* Password Requirements */}
        <div className="p-3 rounded-xl" style={{ backgroundColor: theme.surfaceLight }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ color: theme.textMuted }}>Requirements</p>
          <div className="grid grid-cols-2 gap-1">
            <PasswordReq met={passwordValidation.minLength} text="8+ chars" />
            <PasswordReq met={passwordValidation.hasUppercase} text="Uppercase" />
            <PasswordReq met={passwordValidation.hasLowercase} text="Lowercase" />
            <PasswordReq met={passwordValidation.hasNumber} text="Number" />
            <PasswordReq met={passwordValidation.matches} text="Match" />
          </div>
        </div>
        
        <button
          onClick={handleChangePassword}
          disabled={isChangingPassword || !isPasswordValid || !passwordForm.currentPassword}
          className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: theme.primary }}
        >
          {isChangingPassword ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Changing...
            </span>
          ) : (
            'Update Password'
          )}
        </button>
      </div>

      {/* Delete Account */}
      <div className="pt-4 border-t" style={{ borderColor: theme.border }}>
        <p className="text-xs font-bold uppercase mb-3" style={{ color: theme.danger }}>Danger Zone</p>
        <button
          onClick={() => setActiveSheet('deleteAccount')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl"
          style={{ backgroundColor: '#fee2e2' }}
        >
          <Trash2 className="w-4 h-4 text-red-600" />
          <span className="text-sm font-bold text-red-600">Delete Account</span>
        </button>
      </div>
    </div>
  );

  const renderDeleteAccountSheet = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl" style={{ backgroundColor: '#fee2e2' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-600 mb-1">This cannot be undone!</p>
            <p className="text-xs text-red-600/80">
              All your data including products, sales, customers, and business information will be permanently deleted.
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium mb-2" style={{ color: theme.textSecondary }}>
          Type <span className="font-mono font-bold text-red-600">DELETE MY ACCOUNT</span> to confirm
        </p>
        <input
          type="text"
          placeholder="DELETE MY ACCOUNT"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
          className="w-full px-4 py-3 rounded-xl text-sm font-mono"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textPrimary }}
        />
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => { setActiveSheet('security'); setDeleteConfirmText(''); }}
          className="flex-1 py-3 rounded-xl text-sm font-bold"
          style={{ backgroundColor: theme.surfaceLight, color: theme.textSecondary }}
        >
          Cancel
        </button>
        <button
          onClick={handleDeleteAccount}
          disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
          className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: theme.danger }}
        >
          {isDeletingAccount ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Deleting...
            </span>
          ) : (
            'Delete Forever'
          )}
        </button>
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
        <p className="text-sm text-white/70">Manage your account & preferences</p>
      </div>

      {/* User Card */}
      <div className="px-4 -mt-3">
        <div 
          className="rounded-xl p-4 flex items-center gap-3 shadow-sm"
          style={{ backgroundColor: theme.surface }}
        >
          <div 
            className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {(user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold truncate" style={{ color: theme.textPrimary }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
            </p>
            <p className="text-xs truncate" style={{ color: theme.textMuted }}>{store?.name || 'No store'}</p>
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="p-4 space-y-4">
        {/* Account Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase px-1" style={{ color: theme.textMuted }}>Account</p>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <SettingsRow
              icon={User}
              iconBg={theme.primaryLight}
              iconColor={theme.primary}
              title="Profile"
              subtitle="Edit your personal info"
              onClick={() => setActiveSheet('profile')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Store}
              iconBg="#d1fae5"
              iconColor="#059669"
              title="Store"
              subtitle={store?.name || 'Manage store settings'}
              onClick={() => navigate('/settings')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Briefcase}
              iconBg="#fef3c7"
              iconColor="#d97706"
              title="Business Type"
              subtitle="Set your business category"
              onClick={() => navigate('/settings')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Shield}
              iconBg="#dbeafe"
              iconColor="#2563eb"
              title="Security"
              subtitle="Password & account"
              onClick={() => setActiveSheet('security')}
            />
          </div>
        </div>

        {/* App Settings Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase px-1" style={{ color: theme.textMuted }}>App Settings</p>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <SettingsRow
              icon={Receipt}
              iconBg={theme.primaryLight}
              iconColor={theme.primary}
              title="POS Settings"
              subtitle="Quick add, sounds, receipts"
              onClick={() => setActiveSheet('pos')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Bell}
              iconBg="#e0e7ff"
              iconColor="#4f46e5"
              title="Notifications"
              subtitle="Alerts & reminders"
              onClick={() => setActiveSheet('notifications')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Palette}
              iconBg="#fce7f3"
              iconColor="#db2777"
              title="Appearance"
              subtitle={themeLabels[settings.theme]}
              onClick={() => setActiveSheet('appearance')}
            />
          </div>
        </div>

        {/* Advanced & Billing Section */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase px-1" style={{ color: theme.textMuted }}>More</p>
          <div className="rounded-xl overflow-hidden" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
            <SettingsRow
              icon={CreditCard}
              iconBg="#d1fae5"
              iconColor="#059669"
              title="Billing & Subscription"
              subtitle="Manage your plan"
              onClick={() => navigate('/settings')}
            />
            <div className="h-px mx-3" style={{ backgroundColor: theme.border }} />
            <SettingsRow
              icon={Settings2}
              iconBg="#f1f5f9"
              iconColor="#64748b"
              title="Advanced Settings"
              subtitle="Security, data, integrations"
              onClick={() => navigate('/settings/advanced')}
            />
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl mt-6"
          style={{ backgroundColor: '#fee2e2' }}
        >
          <LogOut className="w-5 h-5 text-red-600" />
          <span className="text-sm font-bold text-red-600">Sign Out</span>
        </button>

        {/* Version */}
        <p className="text-center text-xs pt-2" style={{ color: theme.textMuted }}>
          WarehousePOS v1.0.0
        </p>
      </div>

      {/* Bottom Sheets */}
      <AnimatePresence>
        <BottomSheet 
          isOpen={activeSheet === 'profile'} 
          onClose={() => setActiveSheet(null)}
          title="Edit Profile"
        >
          {renderProfileSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'pos'} 
          onClose={() => setActiveSheet(null)}
          title="POS Settings"
        >
          {renderPOSSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'notifications'} 
          onClose={() => setActiveSheet(null)}
          title="Notifications"
        >
          {renderNotificationsSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'appearance'} 
          onClose={() => setActiveSheet(null)}
          title="Appearance"
        >
          {renderAppearanceSheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'security'} 
          onClose={() => setActiveSheet(null)}
          title="Security"
        >
          {renderSecuritySheet()}
        </BottomSheet>

        <BottomSheet 
          isOpen={activeSheet === 'deleteAccount'} 
          onClose={() => { setActiveSheet(null); setDeleteConfirmText(''); }}
          title="Delete Account"
        >
          {renderDeleteAccountSheet()}
        </BottomSheet>
      </AnimatePresence>
    </div>
  );
}

// Password requirement mini component for mobile
function PasswordReq({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs ${met ? 'text-emerald-600' : 'text-slate-400'}`}>
      {met ? <CheckCircle2 className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-slate-300" />}
      <span>{text}</span>
    </div>
  );
}
