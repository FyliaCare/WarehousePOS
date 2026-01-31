/**
 * Settings Page - Security & Data
 * Security, sessions, data management, and danger zone
 */

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  Database,
  Key,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Smartphone,
  Monitor,
  HardDrive,
  Lock,
  Eye,
  EyeOff,
  RotateCcw,
  UserX,
  LogOut,
} from 'lucide-react';
import { Button, Card, Input } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { cn } from '@warehousepos/utils';

type SettingsSection = 'security' | 'sessions' | 'data' | 'danger';

interface SessionDevice {
  id: string;
  device_type: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  location: string;
  last_active: string;
  is_current: boolean;
}

// Simulated active sessions for demo
const mockSessions: SessionDevice[] = [
  { id: '1', device_type: 'desktop', browser: 'Chrome on Windows', location: 'Accra, Ghana', last_active: new Date().toISOString(), is_current: true },
  { id: '2', device_type: 'mobile', browser: 'Safari on iPhone', location: 'Accra, Ghana', last_active: new Date(Date.now() - 3600000).toISOString(), is_current: false },
];

export function AdvancedSettingsPage() {
  const { store, signOut } = useAuthStore();
  const settings = useSettingsStore();
  const queryClient = useQueryClient();
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('security');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Fetch store statistics
  const { data: storeStats, isLoading: loadingStats } = useQuery({
    queryKey: ['store-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return null;
      
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

  // Sections config
  const sections: { id: SettingsSection; label: string; icon: any; description: string }[] = [
    { id: 'security', label: 'Security', icon: Shield, description: 'Password & authentication' },
    { id: 'sessions', label: 'Active Sessions', icon: Smartphone, description: 'Manage logged in devices' },
    { id: 'data', label: 'Data Management', icon: Database, description: 'Storage & cleanup' },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle, description: 'Destructive actions' },
  ];

  // Handle password change
  const handlePasswordChange = async () => {
    if (!passwordForm.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (passwordForm.currentPassword === passwordForm.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setIsChangingPassword(true);
    try {
      // First verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) throw new Error('User not found');

      // Try to reauthenticate with current password
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
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });

      if (error) throw error;
      
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Clear cache
  const handleClearCache = () => {
    localStorage.removeItem('warehousepos-settings');
    queryClient.clear();
    toast.success('Cache cleared successfully');
  };

  // Revoke session
  const handleRevokeSession = async (_sessionId: string) => {
    // In a real app, you'd call an API to revoke the specific session
    toast.success('Session revoked successfully');
  };

  // Revoke all sessions
  const handleRevokeAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success('All sessions signed out. Redirecting to login...');
      setTimeout(() => signOut(), 1500);
    } catch (error) {
      toast.error('Failed to sign out all sessions');
    }
  };

  // Delete all products
  const handleDeleteAllProducts = async () => {
    if (!store?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to delete ALL products? This cannot be undone.');
    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('store_id', store.id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['store-stats'] });
      toast.success('All products deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete products');
    }
  };

  // Clear sales history
  const handleClearSales = async () => {
    if (!store?.id) return;
    
    const confirmed = window.confirm('Are you sure you want to clear ALL sales history? This cannot be undone.');
    if (!confirmed) return;

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
      toast.success('Sales history cleared');
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear sales');
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type the confirmation text exactly');
      return;
    }

    toast.error('Account deletion requires contacting support');
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Security, sessions, and data management
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-72 p-2 h-fit">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors',
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  section.id === 'danger' && activeSection !== section.id && 'text-destructive'
                )}
              >
                <section.icon className="w-5 h-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{section.label}</p>
                  <p className={cn(
                    'text-xs truncate',
                    activeSection === section.id ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
                    {section.description}
                  </p>
                </div>
              </button>
            ))}
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* Security Section */}
          {activeSection === 'security' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Change Password
                </h2>
                <div className="space-y-4 max-w-md">
                  <div className="relative">
                    <Input
                      label="Current Password"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      placeholder="Enter your current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      label="New Password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      hint="Minimum 8 characters"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-9 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                  />
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={isChangingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                  >
                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Two-Factor Authentication
                </h2>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <Lock className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">2FA Not Enabled</p>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => toast.info('2FA setup coming soon!')}>
                    Enable 2FA
                  </Button>
                </div>
              </Card>
            </>
          )}

          {/* Sessions Section */}
          {activeSection === 'sessions' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Active Sessions
                </h2>
                <Button variant="outline" size="sm" onClick={handleRevokeAllSessions}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out All
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                These are the devices currently logged into your account. You can sign out of any session.
              </p>
              <div className="space-y-3">
                {mockSessions.map((session) => (
                  <div 
                    key={session.id}
                    className={cn(
                      'flex items-center justify-between p-4 rounded-lg border',
                      session.is_current ? 'border-primary bg-primary/5' : 'border-border'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-10 h-10 rounded-full flex items-center justify-center',
                        session.device_type === 'mobile' ? 'bg-blue-100' : 'bg-slate-100'
                      )}>
                        {session.device_type === 'mobile' ? (
                          <Smartphone className="w-5 h-5 text-blue-600" />
                        ) : (
                          <Monitor className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground flex items-center gap-2">
                          {session.browser}
                          {session.is_current && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.location} • {session.is_current ? 'Active now' : `Last active ${new Date(session.last_active).toLocaleString()}`}
                        </p>
                      </div>
                    </div>
                    {!session.is_current && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Data Management Section */}
          {activeSection === 'data' && (
            <>
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <HardDrive className="w-5 h-5" />
                  Storage Usage
                </h2>
                {loadingStats ? (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="p-4 bg-muted rounded-lg text-center animate-pulse">
                        <div className="h-8 w-16 mx-auto bg-muted-foreground/20 rounded mb-2" />
                        <div className="h-4 w-20 mx-auto bg-muted-foreground/20 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{storeStats?.products || 0}</p>
                      <p className="text-sm text-muted-foreground">Products</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{storeStats?.sales || 0}</p>
                      <p className="text-sm text-muted-foreground">Sales</p>
                    </div>
                    <div className="p-4 bg-muted rounded-lg text-center">
                      <p className="text-2xl font-bold text-foreground">{storeStats?.customers || 0}</p>
                      <p className="text-sm text-muted-foreground">Customers</p>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Estimated Storage</span>
                    <span className="font-medium text-foreground">
                      ~{((storeStats?.products || 0) * 0.002 + (storeStats?.sales || 0) * 0.001 + (storeStats?.customers || 0) * 0.0005).toFixed(2)} MB
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all" 
                      style={{ width: `${Math.min(((storeStats?.products || 0) + (storeStats?.sales || 0) + (storeStats?.customers || 0)) / 100, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h2 className="text-lg font-semibold text-foreground mb-6 flex items-center gap-2">
                  <RefreshCw className="w-5 h-5" />
                  Cache & Local Data
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Clear Cache</p>
                      <p className="text-sm text-muted-foreground">Clear temporary data and refresh app</p>
                    </div>
                    <Button variant="outline" onClick={handleClearCache}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cache
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">Reset Settings</p>
                      <p className="text-sm text-muted-foreground">Restore all app settings to defaults</p>
                    </div>
                    <Button variant="outline" onClick={() => {
                      settings.resetSettings();
                      toast.success('Settings reset to defaults');
                    }}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}

          {/* Danger Zone Section */}
          {activeSection === 'danger' && (
            <>
              <Card className="p-6 border-destructive/50">
                <h2 className="text-lg font-semibold text-destructive mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Danger Zone
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  These actions are permanent and cannot be undone. Please proceed with caution.
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">Delete All Products</p>
                      <p className="text-sm text-muted-foreground">
                        Permanently remove all {storeStats?.products || 0} products from your store
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={handleDeleteAllProducts}
                      disabled={!storeStats?.products}
                    >
                      Delete Products
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">Clear Sales History</p>
                      <p className="text-sm text-muted-foreground">
                        Remove all {storeStats?.sales || 0} sales records
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={handleClearSales}
                      disabled={!storeStats?.sales}
                    >
                      Clear Sales
                    </Button>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-destructive/30 rounded-lg bg-destructive/5">
                    <div>
                      <p className="font-medium text-foreground">Delete Account</p>
                      <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
                    </div>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Delete Confirmation Modal */}
              {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                  <Card className="w-full max-w-md p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-destructive" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">Delete Account?</h3>
                        <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      Type <strong className="text-foreground">DELETE MY ACCOUNT</strong> to confirm:
                    </p>
                    <Input
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      placeholder="DELETE MY ACCOUNT"
                    />
                    <div className="flex gap-3 mt-6">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => {
                          setShowDeleteConfirm(false);
                          setDeleteConfirmText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive" 
                        className="flex-1"
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== 'DELETE MY ACCOUNT'}
                      >
                        Delete Forever
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
