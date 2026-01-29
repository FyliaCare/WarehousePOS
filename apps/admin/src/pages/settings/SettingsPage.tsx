import { Save } from 'lucide-react';
import { Card, Button, Input, Switch } from '@warehousepos/ui';

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Platform configuration</p>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">General Settings</h3>
        <div className="space-y-4">
          <Input
            label="Platform Name"
            defaultValue="WarehousePOS"
            placeholder="Platform name"
          />
          <Input
            label="Support Email"
            type="email"
            defaultValue="support@warehousepos.com"
            placeholder="Support email"
          />
          <Input
            label="Support Phone"
            type="tel"
            placeholder="Support phone number"
          />
        </div>
      </Card>

      {/* Feature Flags */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Feature Flags</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">New Registrations</p>
              <p className="text-sm text-muted-foreground">Allow new tenant registrations</p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Portal Feature</p>
              <p className="text-sm text-muted-foreground">Enable customer portal for stores</p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Delivery Feature</p>
              <p className="text-sm text-muted-foreground">Enable delivery tracking</p>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground">Maintenance Mode</p>
              <p className="text-sm text-muted-foreground">Put platform in maintenance mode</p>
            </div>
            <Switch checked={false} onCheckedChange={() => {}} />
          </div>
        </div>
      </Card>

      {/* SMS Configuration */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">SMS Configuration</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">🇬🇭 Ghana (mNotify)</h4>
            <Input
              label="API Key"
              type="password"
              placeholder="mNotify API Key"
            />
            <Input
              label="Sender ID"
              placeholder="WarehousePOS"
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">🇳🇬 Nigeria (Termii)</h4>
            <Input
              label="API Key"
              type="password"
              placeholder="Termii API Key"
            />
            <Input
              label="Sender ID"
              placeholder="WarehousePOS"
            />
          </div>
        </div>
      </Card>

      {/* Payment Configuration */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Payment Configuration (Paystack)</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">🇬🇭 Ghana</h4>
            <Input
              label="Public Key"
              type="password"
              placeholder="pk_test_xxx"
            />
            <Input
              label="Secret Key"
              type="password"
              placeholder="sk_test_xxx"
            />
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">🇳🇬 Nigeria</h4>
            <Input
              label="Public Key"
              type="password"
              placeholder="pk_test_xxx"
            />
            <Input
              label="Secret Key"
              type="password"
              placeholder="sk_test_xxx"
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button className="gap-2">
          <Save className="w-4 h-4" />
          Save Settings
        </Button>
      </div>
    </div>
  );
}
