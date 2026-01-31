import { useState, useEffect } from 'react';
import {
  User,
  Store,
  Bell,
  Receipt,
  Palette,
  CreditCard,
  Moon,
  Sun,
  Monitor,
  MapPin,
  Briefcase,
  Settings2,
  ChevronRight,
  Shield,
  Trash2,
  Key,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
} from 'lucide-react';
import { Button, Card, Input, Switch } from '@warehousepos/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';
import { StoreLocationPicker, type StoreLocation } from '@/components/maps';
import { BusinessCategoryPicker } from '@/components/settings';
import { getBusinessCategory } from '../../../../../packages/shared/src/data/business-categories';
import type { CountryCode } from '@warehousepos/types';

type SettingsTab = 'profile' | 'store' | 'business' | 'pos' | 'notifications' | 'appearance' | 'security' | 'billing';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { user, tenant, store } = useAuthStore();
  const settings = useSettingsStore();

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'store' as const, label: 'Store', icon: Store },
    { id: 'business' as const, label: 'Business Type', icon: Briefcase },
    { id: 'pos' as const, label: 'POS Settings', icon: Receipt },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'billing' as const, label: 'Billing', icon: CreditCard },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and store settings
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <Card className="lg:w-64 p-2 h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
            
            {/* Advanced Settings Link */}
            <a
              href="/settings/advanced"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-muted-foreground hover:bg-muted hover:text-foreground border-t border-border mt-2 pt-3"
            >
              <Settings2 className="w-5 h-5" />
              Advanced
              <ChevronRight className="w-4 h-4 ml-auto" />
            </a>
          </nav>
        </Card>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Profile Settings</h2>
              <div className="space-y-4 max-w-md">
                <Input
                  label="First Name"
                  defaultValue={user?.first_name}
                />
                <Input
                  label="Last Name"
                  defaultValue={user?.last_name}
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={user?.email}
                  disabled
                  hint="Contact support to change your email"
                />
                <Input
                  label="Phone"
                  defaultValue={user?.phone}
                />
                <Button onClick={() => toast.success('Profile updated!')}>
                  Save Changes
                </Button>
              </div>
            </Card>
          )}

          {activeTab === 'store' && (
            <StoreSettingsTab store={store} tenant={tenant} />
          )}

          {activeTab === 'business' && (
            <BusinessTypeTab tenant={tenant} />
          )}

          {activeTab === 'pos' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">POS Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Quick Add</p>
                    <p className="text-sm text-muted-foreground">
                      Single tap to add items to cart
                    </p>
                  </div>
                  <Switch
                    checked={settings.quickAddEnabled}
                    onCheckedChange={settings.setQuickAdd}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Sound Effects</p>
                    <p className="text-sm text-muted-foreground">
                      Play sounds for actions
                    </p>
                  </div>
                  <Switch
                    checked={settings.soundEnabled}
                    onCheckedChange={settings.setSound}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Auto Print Receipt</p>
                    <p className="text-sm text-muted-foreground">
                      Print receipt after each sale
                    </p>
                  </div>
                  <Switch
                    checked={settings.printReceipt}
                    onCheckedChange={settings.setPrintReceipt}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Low Stock Warnings</p>
                    <p className="text-sm text-muted-foreground">
                      Show warnings for low stock items
                    </p>
                  </div>
                  <Switch
                    checked={settings.showStockWarnings}
                    onCheckedChange={settings.setShowStockWarnings}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Show Product Images</p>
                    <p className="text-sm text-muted-foreground">
                      Display images in product grid
                    </p>
                  </div>
                  <Switch
                    checked={settings.showProductImages}
                    onCheckedChange={settings.setShowProductImages}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Low Stock Threshold
                  </label>
                  <Input
                    type="number"
                    value={settings.lowStockThreshold}
                    onChange={(e) => settings.setLowStockThreshold(Number(e.target.value))}
                    className="max-w-32"
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Notification Settings</h2>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Low Stock Alerts</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified when products are low
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">New Orders</p>
                    <p className="text-sm text-muted-foreground">
                      Get notified for new online orders
                    </p>
                  </div>
                  <Switch checked={true} onCheckedChange={() => {}} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Daily Reports</p>
                    <p className="text-sm text-muted-foreground">
                      Receive daily sales summary
                    </p>
                  </div>
                  <Switch checked={false} onCheckedChange={() => {}} />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Appearance</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Theme
                  </label>
                  <div className="flex gap-3">
                    {[
                      { value: 'light', icon: Sun, label: 'Light' },
                      { value: 'dark', icon: Moon, label: 'Dark' },
                      { value: 'system', icon: Monitor, label: 'System' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => settings.setTheme(theme.value as any)}
                        className={cn(
                          'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                          settings.theme === theme.value
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        )}
                      >
                        <theme.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Compact Mode</p>
                    <p className="text-sm text-muted-foreground">
                      Use smaller spacing and fonts
                    </p>
                  </div>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={settings.setCompactMode}
                  />
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <SecurityTab user={user} />
          )}

          {activeTab === 'billing' && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Billing & Subscription</h2>
              <div className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-muted-foreground">Current Plan</span>
                    <span className="font-semibold text-foreground capitalize">
                      {tenant?.subscription_status || 'free'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Next Billing Date</span>
                    <span className="text-foreground">
                      {tenant?.subscription_ends_at
                        ? new Date(tenant.subscription_ends_at).toLocaleDateString()
                        : 'N/A'}
                    </span>
                  </div>
                </div>
                <Button variant="outline">
                  Manage Subscription
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Store Settings Tab Component
function StoreSettingsTab({ store, tenant }: { store: any; tenant: any }) {
  const country = (tenant?.country === 'NG' ? 'NG' : 'GH') as CountryCode;
  
  const [formData, setFormData] = useState({
    name: store?.name || '',
    address: store?.address || '',
    phone: store?.phone || '',
    email: store?.email || '',
  });
  
  const [storeLocation, setStoreLocation] = useState<StoreLocation | null>(
    store?.latitude && store?.longitude 
      ? { lat: store.latitude, lng: store.longitude }
      : null
  );
  const [isSaving, setIsSaving] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (store) {
      setFormData({
        name: store.name || '',
        address: store.address || '',
        phone: store.phone || '',
        email: store.email || '',
      });
      if (store.latitude && store.longitude) {
        setStoreLocation({ lat: store.latitude, lng: store.longitude });
      }
    }
  }, [store]);

  const handleSave = async () => {
    if (!store?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          latitude: storeLocation?.lat,
          longitude: storeLocation?.lng,
          updated_at: new Date().toISOString(),
        })
        .eq('id', store.id);

      if (error) throw error;
      toast.success('Store settings updated!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save store settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Basic Info Card */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-6">Store Information</h2>
        <div className="space-y-4 max-w-md">
          <Input
            label="Business Name"
            defaultValue={tenant?.name}
            disabled
            hint="Contact support to change business name"
          />
          <Input
            label="Store Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <Input
            label="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
      </Card>

      {/* Store Location Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Store Location</h2>
            <p className="text-sm text-muted-foreground">
              Set your store location for delivery zone mapping
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowMap(!showMap)}
            className="flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            {showMap ? 'Hide Map' : 'Set Location'}
          </Button>
        </div>

        {storeLocation && (
          <div className="mb-4 p-3 bg-muted rounded-lg flex items-center gap-3">
            <MapPin className="w-5 h-5 text-primary" />
            <div>
              <p className="text-sm font-medium text-foreground">Location Set</p>
              <p className="text-xs text-muted-foreground font-mono">
                {storeLocation.lat.toFixed(6)}, {storeLocation.lng.toFixed(6)}
              </p>
            </div>
          </div>
        )}

        {showMap && (
          <StoreLocationPicker
            country={country}
            location={storeLocation}
            onLocationChange={setStoreLocation}
            height="400px"
            className="mt-4"
          />
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}

// Business Type Tab Component
function BusinessTypeTab({ tenant }: { tenant: any }) {
  const { refreshUser } = useAuthStore();
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>(
    tenant?.business_type || ''
  );
  const [isSaving, setIsSaving] = useState(false);

  // Get current business category info
  const currentCategory = tenant?.business_type 
    ? getBusinessCategory(tenant.business_type) 
    : null;

  const handleSave = async () => {
    if (!tenant?.id || !selectedBusinessType) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          business_type: selectedBusinessType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tenant.id);

      if (error) throw error;
      
      // Refresh user data to get updated tenant
      await refreshUser();
      
      toast.success('Business type updated!', {
        description: 'Your product forms will now show relevant fields for your business.'
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to update business type');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanged = selectedBusinessType !== (tenant?.business_type || '');

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">Business Type</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Select your business type to get customized categories and product fields. 
          This helps tailor the POS experience to your specific needs.
        </p>

        {/* Current Selection */}
        {currentCategory && !hasChanged && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{currentCategory.emoji}</span>
              <div>
                <p className="font-semibold text-foreground">{currentCategory.name}</p>
                <p className="text-sm text-muted-foreground">{currentCategory.description}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {currentCategory.tags.slice(0, 5).map(tag => (
                <span 
                  key={tag}
                  className="px-2 py-0.5 text-xs rounded-full bg-background text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <BusinessCategoryPicker
          value={selectedBusinessType}
          onChange={setSelectedBusinessType}
          showSearch={true}
          showSectorGroups={true}
        />
      </Card>

      {/* Save Button */}
      {hasChanged && (
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={() => setSelectedBusinessType(tenant?.business_type || '')}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Business Type'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Security Tab Component
function SecurityTab({ user }: { user: any }) {
  const { signOut } = useAuthStore();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

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

      toast.success('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Call the delete account edge function
      const { error } = await supabase.functions.invoke('delete-account', {
        body: { userId: user?.id }
      });

      if (error) throw error;

      toast.success('Account deletion initiated');
      await signOut();
    } catch (error: any) {
      // If edge function doesn't exist, show a message to contact support
      toast.error('Please contact support@warehousepos.com to delete your account');
      setShowDeleteConfirm(false);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change Section */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            <p className="text-sm text-muted-foreground">
              Update your password to keep your account secure
            </p>
          </div>
          <Key className="w-5 h-5 text-muted-foreground" />
        </div>

        {!showPasswordForm ? (
          <Button onClick={() => setShowPasswordForm(true)}>
            Change Password
          </Button>
        ) : (
          <div className="space-y-4 max-w-md">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-muted rounded-lg p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                Password Requirements
              </p>
              <ul className="space-y-1.5">
                <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                <PasswordRequirement met={passwordValidation.hasUppercase} text="One uppercase letter" />
                <PasswordRequirement met={passwordValidation.hasLowercase} text="One lowercase letter" />
                <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                <PasswordRequirement met={passwordValidation.matches} text="Passwords match" />
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !isPasswordValid || !passwordForm.currentPassword}
              >
                {isChangingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Changing...
                  </>
                ) : (
                  'Update Password'
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Account Deletion Section */}
      <Card className="p-6 border-destructive/50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-destructive">Danger Zone</h2>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data
            </p>
          </div>
          <AlertTriangle className="w-5 h-5 text-destructive" />
        </div>

        {!showDeleteConfirm ? (
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Account
          </Button>
        ) : (
          <div className="space-y-4 max-w-md">
            <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
              <p className="text-sm text-destructive font-medium mb-2">
                ⚠️ This action cannot be undone!
              </p>
              <p className="text-sm text-muted-foreground">
                This will permanently delete:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                <li>Your account and profile</li>
                <li>All your business data</li>
                <li>All stores and products</li>
                <li>All sales history and reports</li>
                <li>All customer data</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Type <span className="font-mono text-destructive">DELETE MY ACCOUNT</span> to confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE MY ACCOUNT"
                className="font-mono"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
              >
                {isDeletingAccount ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  'Permanently Delete Account'
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Password requirement indicator component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${met ? 'text-emerald-600' : 'text-muted-foreground'}`}>
      {met ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-muted-foreground/30" />
      )}
      <span>{text}</span>
    </li>
  );
}
