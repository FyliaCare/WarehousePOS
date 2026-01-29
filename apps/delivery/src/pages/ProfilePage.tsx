import { useNavigate } from 'react-router-dom';
import { Phone, Mail, LogOut, Shield, Bell } from 'lucide-react';
import { Card, Avatar, Button, Switch } from '@warehousepos/ui';
import { formatPhone } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

export function ProfilePage() {
  const navigate = useNavigate();
  const { rider, store, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
    navigate('/login');
  };

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <Avatar name={rider?.name || 'Rider'} size="xl" />
          <div>
            <h1 className="text-xl font-bold text-foreground">{rider?.name}</h1>
            <p className="text-muted-foreground">{store?.name}</p>
          </div>
        </div>
      </Card>

      {/* Contact Info */}
      <Card>
        <div className="divide-y divide-border">
          <div className="p-4 flex items-center gap-3">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium text-foreground">
                {formatPhone(rider?.phone || '', store?.tenant?.country || 'GH')}
              </p>
            </div>
          </div>
          {rider?.email && (
            <div className="p-4 flex items-center gap-3">
              <Mail className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium text-foreground">{rider.email}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Settings */}
      <Card>
        <div className="divide-y divide-border">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Push Notifications</span>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <span className="text-foreground">Location Sharing</span>
            </div>
            <Switch checked={true} onCheckedChange={() => {}} />
          </div>
        </div>
      </Card>

      {/* Stats */}
      <Card className="p-4">
        <h2 className="font-semibold text-foreground mb-3">Your Stats</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">
              {rider?.total_deliveries || 0}
            </p>
            <p className="text-sm text-muted-foreground">Total Deliveries</p>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-foreground">
              {rider?.average_rating?.toFixed(1) || '5.0'}
            </p>
            <p className="text-sm text-muted-foreground">Rating</p>
          </div>
        </div>
      </Card>

      {/* Sign Out */}
      <Button
        variant="outline"
        className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleSignOut}
      >
        <LogOut className="w-5 h-5 mr-2" />
        Sign Out
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        WarehousePOS Delivery App v1.0.0
      </p>
    </div>
  );
}
