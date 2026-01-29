import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, Building2, Store, Users, Loader2, 
  CreditCard, ShoppingCart, TrendingUp,
  Edit, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react';
import { Card, Badge, Button, Modal, Select, Input, Tabs, TabsList, TabsTrigger, TabsContent } from '@warehousepos/ui';
import { formatDate, formatCurrency } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Tenant {
  id: string;
  business_name: string;
  email: string;
  phone: string;
  country: string;
  is_active: boolean;
  subscription_tier: string;
  subscription_status: string;
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  approved_at: string | null;
  suspended_at: string | null;
  suspension_reason: string | null;
  notes: string | null;
  created_at: string;
  stores: any[];
  users: any[];
}

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  price_ghs: number;
  price_ngn: number;
  features: string[];
  limits: Record<string, number | boolean>;
}

export function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [editModal, setEditModal] = useState(false);
  const [planModal, setPlanModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['tenant', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('tenants')
        .select('*, stores:stores(*), users:users(*)')
        .eq('id', id)
        .single();
      return data as Tenant;
    },
    enabled: !!id,
  });

  const { data: plans } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      return data as SubscriptionPlan[];
    },
  });

  const { data: tenantStats } = useQuery({
    queryKey: ['tenant-stats', id],
    queryFn: async () => {
      if (!tenant?.stores?.length) return { orders: 0, revenue: 0, products: 0 };
      
      const storeIds = tenant.stores.map((s: any) => s.id);
      
      const [ordersResult, productsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, total')
          .in('store_id', storeIds)
          .eq('payment_status', 'paid'),
        supabase
          .from('products')
          .select('id', { count: 'exact' })
          .eq('tenant_id', id),
      ]);

      const orders = ordersResult.data || [];
      const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

      return {
        orders: orders.length,
        revenue,
        products: productsResult.count || 0,
      };
    },
    enabled: !!tenant?.stores?.length,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['tenant-orders', id],
    queryFn: async () => {
      if (!tenant?.stores?.length) return [];
      const storeIds = tenant.stores.map((s: any) => s.id);
      const { data } = await supabase
        .from('orders')
        .select('*, store:stores(name)')
        .in('store_id', storeIds)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: !!tenant?.stores?.length,
  });

  const updateTenantMutation = useMutation({
    mutationFn: async (updates: Partial<Tenant>) => {
      const { error } = await supabase
        .from('tenants')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tenant updated');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setEditModal(false);
    },
    onError: () => toast.error('Failed to update tenant'),
  });

  const assignPlanMutation = useMutation({
    mutationFn: async (planId: string) => {
      const plan = plans?.find(p => p.id === planId);
      if (!plan) throw new Error('Plan not found');
      
      // Update tenant's subscription tier
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({ 
          subscription_tier: plan.slug,
          subscription_status: 'active',
        })
        .eq('id', id);
      if (tenantError) throw tenantError;

      // Create or update subscription record
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert({
          tenant_id: id,
          plan_id: planId,
          status: 'active',
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }, {
          onConflict: 'tenant_id'
        });
      if (subError) throw subError;
    },
    onSuccess: () => {
      toast.success('Subscription plan assigned');
      queryClient.invalidateQueries({ queryKey: ['tenant', id] });
      setPlanModal(false);
    },
    onError: () => toast.error('Failed to assign plan'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Tenant not found</p>
        <Link to="/tenants">
          <Button>Back to Tenants</Button>
        </Link>
      </div>
    );
  }

  const currency = tenant.country === 'GH' ? 'GHS' : 'NGN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/tenants"
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">{tenant.business_name}</h1>
            <Badge variant={tenant.is_active ? 'success' : 'destructive'}>
              {tenant.is_active ? 'Active' : 'Suspended'}
            </Badge>
            <Badge variant={tenant.subscription_status === 'active' ? 'success' : tenant.subscription_status === 'trial' ? 'info' : 'warning'}>
              {tenant.subscription_status || 'trial'}
            </Badge>
            {tenant.subscription_tier && (
              <Badge variant="outline" className="capitalize">
                {tenant.subscription_tier} Plan
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground">
            {tenant.country === 'GH' ? '🇬🇭 Ghana' : '🇳🇬 Nigeria'} • Created {formatDate(tenant.created_at, 'full')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setPlanModal(true)}>
            <CreditCard className="w-4 h-4 mr-2" />
            Assign Plan
          </Button>
          <Button variant="outline" onClick={() => setEditModal(true)}>
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </div>
      </div>

      {/* Warning Banners */}
      {!tenant.approved_at && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800 dark:text-yellow-200">
              This tenant is pending approval. They have limited access until approved.
            </span>
            <Button 
              size="sm" 
              onClick={() => updateTenantMutation.mutate({ approved_at: new Date().toISOString(), is_active: true })}
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Approve Now
            </Button>
          </div>
        </Card>
      )}
      
      {tenant.suspended_at && (
        <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <span className="text-red-800 dark:text-red-200">
                Suspended on {formatDate(tenant.suspended_at, 'full')}
              </span>
              {tenant.suspension_reason && (
                <p className="text-sm text-red-600 dark:text-red-300">
                  Reason: {tenant.suspension_reason}
                </p>
              )}
            </div>
            <Button 
              size="sm"
              variant="outline"
              onClick={() => updateTenantMutation.mutate({ is_active: true, suspended_at: null, suspension_reason: null })}
            >
              Reactivate
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Store className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Stores</p>
              <p className="text-xl font-bold text-foreground">{tenant.stores?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Users</p>
              <p className="text-xl font-bold text-foreground">{tenant.users?.length || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Orders</p>
              <p className="text-xl font-bold text-foreground">{tenantStats?.orders || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Revenue</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(tenantStats?.revenue || 0, currency)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Products</p>
              <p className="text-xl font-bold text-foreground">{tenantStats?.products || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Details */}
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="stores">Stores ({tenant.stores?.length || 0})</TabsTrigger>
          <TabsTrigger value="users">Users ({tenant.users?.length || 0})</TabsTrigger>
          <TabsTrigger value="orders">Recent Orders</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Tenant Information</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Business Name</p>
                  <p className="text-foreground">{tenant.business_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="text-foreground">{tenant.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="text-foreground">{tenant.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Subscription Plan</p>
                  <p className="text-foreground capitalize">{tenant.subscription_tier || 'Free'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Country</p>
                  <p className="text-foreground">
                    {tenant.country === 'GH' ? '🇬🇭 Ghana' : '🇳🇬 Nigeria'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Currency</p>
                  <p className="text-foreground">
                    {tenant.country === 'GH' ? 'GHS (₵)' : 'NGN (₦)'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Created</p>
                  <p className="text-foreground">{formatDate(tenant.created_at, 'full')}</p>
                </div>
                {tenant.trial_ends_at && (
                  <div>
                    <p className="text-sm text-muted-foreground">Trial Ends</p>
                    <p className="text-foreground">{formatDate(tenant.trial_ends_at, 'full')}</p>
                  </div>
                )}
              </div>
            </div>
            {tenant.notes && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground">Admin Notes</p>
                <p className="text-foreground mt-1">{tenant.notes}</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="stores">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Stores</h3>
            {tenant.stores && tenant.stores.length > 0 ? (
              <div className="space-y-3">
                {tenant.stores.map((store: any) => (
                  <Link
                    key={store.id}
                    to={`/stores/${store.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{store.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {store.slug}.warehousepos.com
                      </p>
                    </div>
                    <Badge variant={store.is_active ? 'success' : 'secondary'}>
                      {store.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No stores yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Users</h3>
            {tenant.users && tenant.users.length > 0 ? (
              <div className="space-y-3">
                {tenant.users.map((user: any) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{user.full_name}</p>
                      <p className="text-sm text-muted-foreground">{user.phone || user.email}</p>
                    </div>
                    <Badge variant="secondary">{user.role}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No users yet</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="p-6">
            <h3 className="font-semibold text-foreground mb-4">Recent Orders</h3>
            {recentOrders && recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order: any) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">#{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.store?.name} • {formatDate(order.created_at, 'short')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-foreground">
                        {formatCurrency(order.total, currency)}
                      </p>
                      <Badge variant={order.status === 'completed' || order.status === 'delivered' ? 'success' : 'secondary'}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No orders yet</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Plan Modal */}
      <Modal
        open={planModal}
        onOpenChange={() => setPlanModal(false)}
        title="Assign Subscription Plan"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Assign a subscription plan to <strong>{tenant.business_name}</strong>.
          </p>
          <Select
            value={selectedPlan}
            onValueChange={setSelectedPlan}
            options={plans?.map(p => ({
              value: p.id,
              label: `${p.name} - ${tenant.country === 'GH' ? `₵${p.price_ghs}` : `₦${p.price_ngn}`}/month`
            })) || []}
            placeholder="Select a plan"
          />
          {selectedPlan && plans && (
            <Card className="p-4 bg-muted/50">
              {(() => {
                const plan = plans.find(p => p.id === selectedPlan);
                if (!plan) return null;
                return (
                  <div>
                    <h4 className="font-semibold">{plan.name}</h4>
                    <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                      {(plan.features as string[])?.map((f, i) => (
                        <li key={i}>✓ {f}</li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
            </Card>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPlanModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => assignPlanMutation.mutate(selectedPlan)}
              disabled={!selectedPlan || assignPlanMutation.isPending}
            >
              {assignPlanMutation.isPending ? 'Assigning...' : 'Assign Plan'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={editModal}
        onOpenChange={() => setEditModal(false)}
        title="Edit Tenant"
      >
        <form 
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            updateTenantMutation.mutate({
              business_name: formData.get('business_name') as string,
              email: formData.get('email') as string,
              phone: formData.get('phone') as string,
              notes: formData.get('notes') as string,
            });
          }}
        >
          <Input
            label="Business Name"
            name="business_name"
            defaultValue={tenant.business_name}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            defaultValue={tenant.email}
          />
          <Input
            label="Phone"
            name="phone"
            defaultValue={tenant.phone}
          />
          <div>
            <label className="text-sm font-medium">Admin Notes</label>
            <textarea
              name="notes"
              className="w-full mt-1 p-3 border rounded-lg"
              rows={3}
              defaultValue={tenant.notes || ''}
              placeholder="Internal notes about this tenant..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateTenantMutation.isPending}>
              {updateTenantMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
