import { useState } from 'react';
import {
  User,
  Store,
  Bell,
  Receipt,
  Palette,
  CreditCard,
  ChevronRight,
  Moon,
  Sun,
  Monitor,
} from 'lucide-react';
import { Button, Card, Input, Switch } from '@warehousepos/ui';
import { useSettingsStore } from '@/stores/settingsStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import { cn } from '@warehousepos/utils';

type SettingsTab = 'profile' | 'store' | 'pos' | 'notifications' | 'appearance' | 'billing';

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { user, tenant, store } = useAuthStore();
  const settings = useSettingsStore();

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: User },
    { id: 'store' as const, label: 'Store', icon: Store },
    { id: 'pos' as const, label: 'POS Settings', icon: Receipt },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'appearance' as const, label: 'Appearance', icon: Palette },
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
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Store Settings</h2>
              <div className="space-y-4 max-w-md">
                <Input
                  label="Business Name"
                  defaultValue={tenant?.name}
                />
                <Input
                  label="Store Name"
                  defaultValue={store?.name}
                />
                <Input
                  label="Address"
                  defaultValue={store?.address}
                />
                <Input
                  label="Phone"
                  defaultValue={store?.phone}
                />
                <Input
                  label="Email"
                  type="email"
                  defaultValue={store?.email}
                />
                <Button onClick={() => toast.success('Store settings updated!')}>
                  Save Changes
                </Button>
              </div>
            </Card>
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
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
