import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CreditCard, Plus, Edit, 
  Check, Star, Zap, Crown, DollarSign, TrendingUp,
  Users, Package
} from 'lucide-react';
import { Card, Badge, Skeleton, Button, Modal, Input } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SubscriptionPlan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_ghs: number;
  price_ngn: number;
  yearly_price_ghs: number;
  yearly_price_ngn: number;
  features: string[];
  limits: {
    products: number;
    staff: number;
    stores: number;
    monthly_orders: number;
    sms_credits: number;
    api_access: boolean;
    white_label: boolean;
    priority_support: boolean;
  };
  is_active: boolean;
  is_featured: boolean;
  trial_days: number;
  sort_order: number;
}

interface Subscription {
  id: string;
  tenant_id: string;
  plan_id: string;
  status: string;
  billing_cycle: string;
  current_period_start: string;
  current_period_end: string;
  tenant: {
    business_name: string;
    country: string;
  };
  plan?: SubscriptionPlan;
}

const planIcons: Record<string, any> = {
  free: Package,
  starter: Zap,
  business: Star,
  enterprise: Crown,
};

export function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'active'>('plans');
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');
      return data as SubscriptionPlan[];
    },
  });

  const { data: subscriptions, isLoading: subsLoading } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, tenant:tenants(business_name, country), plan:subscription_plans(*)')
        .order('created_at', { ascending: false });
      return data as Subscription[];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      const [active, trial, cancelled] = await Promise.all([
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'active'),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'trial'),
        supabase.from('subscriptions').select('id', { count: 'exact' }).eq('status', 'cancelled'),
      ]);

      // Calculate MRR (Monthly Recurring Revenue)
      const { data: activeSubscriptions } = await supabase
        .from('subscriptions')
        .select('tenant:tenants(country), plan:subscription_plans(price_ghs, price_ngn)')
        .eq('status', 'active');

      let mrrGhs = 0;
      let mrrNgn = 0;
      (activeSubscriptions || []).forEach((s: any) => {
        if (s.tenant?.country === 'GH') {
          mrrGhs += s.plan?.price_ghs || 0;
        } else {
          mrrNgn += s.plan?.price_ngn || 0;
        }
      });

      return {
        active: active.count || 0,
        trial: trial.count || 0,
        cancelled: cancelled.count || 0,
        mrrGhs,
        mrrNgn,
      };
    },
  });

  const updatePlanMutation = useMutation({
    mutationFn: async (plan: Partial<SubscriptionPlan> & { id: string }) => {
      const { error } = await supabase
        .from('subscription_plans')
        .update(plan)
        .eq('id', plan.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Plan updated');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setEditPlan(null);
      setShowPlanModal(false);
    },
    onError: () => toast.error('Failed to update plan'),
  });

  const createPlanMutation = useMutation({
    mutationFn: async (plan: Omit<SubscriptionPlan, 'id'>) => {
      const { error } = await supabase
        .from('subscription_plans')
        .insert(plan);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Plan created');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
      setShowPlanModal(false);
    },
    onError: () => toast.error('Failed to create plan'),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'cancelled': return 'destructive';
      case 'expired': return 'secondary';
      case 'trial': return 'info';
      case 'past_due': return 'warning';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Subscriptions</h1>
          <p className="text-muted-foreground">Manage plans and tenant subscriptions</p>
        </div>
        <Button className="gap-2" onClick={() => { setEditPlan(null); setShowPlanModal(true); }}>
          <Plus className="w-4 h-4" />
          New Plan
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active</p>
              <p className="text-xl font-bold text-green-600">{stats?.active || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trial</p>
              <p className="text-xl font-bold text-blue-600">{stats?.trial || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cancelled</p>
              <p className="text-xl font-bold text-red-600">{stats?.cancelled || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">MRR 🇬🇭</p>
              <p className="text-xl font-bold text-purple-600">₵{stats?.mrrGhs?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">MRR 🇳🇬</p>
              <p className="text-xl font-bold text-orange-600">₦{stats?.mrrNgn?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'plans' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('plans')}
        >
          Subscription Plans
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'active' ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground'}`}
          onClick={() => setActiveTab('active')}
        >
          Active Subscriptions
        </button>
      </div>

      {activeTab === 'plans' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {plansLoading ? (
            [...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <Skeleton className="h-10 w-full" />
              </Card>
            ))
          ) : (
            plans?.map((plan) => {
              const Icon = planIcons[plan.slug] || Package;
              return (
                <Card key={plan.id} className={`p-6 relative ${plan.is_featured ? 'border-primary border-2' : ''}`}>
                  {plan.is_featured && (
                    <Badge className="absolute -top-2 left-1/2 -translate-x-1/2">Popular</Badge>
                  )}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{plan.name}</h3>
                      {!plan.is_active && <Badge variant="secondary">Inactive</Badge>}
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold text-foreground">₵{plan.price_ghs}</span>
                      <span className="text-muted-foreground">/mo</span>
                    </div>
                    <p className="text-sm text-muted-foreground">or ₦{plan.price_ngn}/mo</p>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="space-y-2 mb-4">
                    {(plan.features as string[])?.slice(0, 4).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {(plan.features as string[])?.length > 4 && (
                      <p className="text-xs text-muted-foreground">
                        +{(plan.features as string[]).length - 4} more features
                      </p>
                    )}
                  </div>

                  <div className="border-t pt-4 space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span>Products</span>
                      <span>{plan.limits.products === -1 ? 'Unlimited' : plan.limits.products}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff</span>
                      <span>{plan.limits.staff === -1 ? 'Unlimited' : plan.limits.staff}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stores</span>
                      <span>{plan.limits.stores}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SMS Credits/mo</span>
                      <span>{plan.limits.sms_credits}</span>
                    </div>
                  </div>

                  <Button 
                    variant="outline" 
                    className="w-full mt-4"
                    onClick={() => { setEditPlan(plan); setShowPlanModal(true); }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Plan
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'active' && (
        <div className="space-y-4">
          {subsLoading ? (
            [...Array(5)].map((_, i) => (
              <Card key={i} className="p-4">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))
          ) : subscriptions && subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <Card key={sub.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <CreditCard className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">
                          {sub.tenant?.business_name}
                        </h3>
                        <Badge variant={getStatusColor(sub.status)}>{sub.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground capitalize">
                        {sub.plan?.name} Plan • {sub.billing_cycle || 'monthly'}
                        {' • '}
                        {sub.tenant?.country === 'GH' ? `₵${sub.plan?.price_ghs}` : `₦${sub.plan?.price_ngn}`}/month
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {sub.current_period_end
                          ? `Renews ${formatDate(sub.current_period_end, 'short')}`
                          : `Started ${formatDate(sub.current_period_start, 'short')}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {sub.tenant?.country === 'GH' ? '🇬🇭' : '🇳🇬'}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="font-medium text-foreground">No subscriptions yet</p>
              <p className="text-sm text-muted-foreground">Subscriptions will appear here</p>
            </Card>
          )}
        </div>
      )}

      {/* Plan Edit/Create Modal */}
      <Modal
        open={showPlanModal}
        onOpenChange={() => { setShowPlanModal(false); setEditPlan(null); }}
        title={editPlan ? `Edit ${editPlan.name} Plan` : 'Create New Plan'}
      >
        <form
          className="space-y-4 max-h-[70vh] overflow-y-auto"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const planData = {
              name: formData.get('name') as string,
              slug: formData.get('slug') as string,
              description: formData.get('description') as string,
              price_ghs: parseFloat(formData.get('price_ghs') as string) || 0,
              price_ngn: parseFloat(formData.get('price_ngn') as string) || 0,
              yearly_price_ghs: parseFloat(formData.get('yearly_price_ghs') as string) || 0,
              yearly_price_ngn: parseFloat(formData.get('yearly_price_ngn') as string) || 0,
              features: (formData.get('features') as string).split('\n').filter(Boolean),
              limits: {
                products: parseInt(formData.get('limit_products') as string) || -1,
                staff: parseInt(formData.get('limit_staff') as string) || 1,
                stores: parseInt(formData.get('limit_stores') as string) || 1,
                monthly_orders: parseInt(formData.get('limit_orders') as string) || -1,
                sms_credits: parseInt(formData.get('limit_sms') as string) || 0,
                api_access: formData.get('api_access') === 'on',
                white_label: formData.get('white_label') === 'on',
                priority_support: formData.get('priority_support') === 'on',
              },
              is_active: formData.get('is_active') === 'on',
              is_featured: formData.get('is_featured') === 'on',
              trial_days: parseInt(formData.get('trial_days') as string) || 14,
              sort_order: parseInt(formData.get('sort_order') as string) || 0,
            };

            if (editPlan) {
              updatePlanMutation.mutate({ ...planData, id: editPlan.id });
            } else {
              createPlanMutation.mutate(planData as any);
            }
          }}
        >
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              name="name"
              defaultValue={editPlan?.name}
              required
            />
            <Input
              label="Slug"
              name="slug"
              defaultValue={editPlan?.slug}
              placeholder="e.g., starter"
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              name="description"
              className="w-full mt-1 p-3 border rounded-lg"
              rows={2}
              defaultValue={editPlan?.description}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Price (GHS/month)"
              name="price_ghs"
              type="number"
              step="0.01"
              defaultValue={editPlan?.price_ghs}
            />
            <Input
              label="Price (NGN/month)"
              name="price_ngn"
              type="number"
              step="0.01"
              defaultValue={editPlan?.price_ngn}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Yearly Price (GHS)"
              name="yearly_price_ghs"
              type="number"
              step="0.01"
              defaultValue={editPlan?.yearly_price_ghs}
            />
            <Input
              label="Yearly Price (NGN)"
              name="yearly_price_ngn"
              type="number"
              step="0.01"
              defaultValue={editPlan?.yearly_price_ngn}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Features (one per line)</label>
            <textarea
              name="features"
              className="w-full mt-1 p-3 border rounded-lg"
              rows={4}
              defaultValue={(editPlan?.features as string[])?.join('\n')}
              placeholder="Basic POS&#10;Up to 50 products&#10;Email support"
            />
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Limits (-1 for unlimited)</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label="Products"
                name="limit_products"
                type="number"
                defaultValue={editPlan?.limits?.products ?? -1}
              />
              <Input
                label="Staff"
                name="limit_staff"
                type="number"
                defaultValue={editPlan?.limits?.staff ?? 1}
              />
              <Input
                label="Stores"
                name="limit_stores"
                type="number"
                defaultValue={editPlan?.limits?.stores ?? 1}
              />
              <Input
                label="Monthly Orders"
                name="limit_orders"
                type="number"
                defaultValue={editPlan?.limits?.monthly_orders ?? -1}
              />
              <Input
                label="SMS Credits/mo"
                name="limit_sms"
                type="number"
                defaultValue={editPlan?.limits?.sms_credits ?? 0}
              />
              <Input
                label="Trial Days"
                name="trial_days"
                type="number"
                defaultValue={editPlan?.trial_days ?? 14}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Options</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="api_access"
                  defaultChecked={editPlan?.limits?.api_access}
                  className="rounded"
                />
                <span className="text-sm">API Access</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="white_label"
                  defaultChecked={editPlan?.limits?.white_label}
                  className="rounded"
                />
                <span className="text-sm">White Label</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="priority_support"
                  defaultChecked={editPlan?.limits?.priority_support}
                  className="rounded"
                />
                <span className="text-sm">Priority Support</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_active"
                  defaultChecked={editPlan?.is_active ?? true}
                  className="rounded"
                />
                <span className="text-sm">Active</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={editPlan?.is_featured}
                  className="rounded"
                />
                <span className="text-sm">Featured</span>
              </label>
              <Input
                label="Sort Order"
                name="sort_order"
                type="number"
                defaultValue={editPlan?.sort_order ?? 0}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setShowPlanModal(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePlanMutation.isPending || createPlanMutation.isPending}>
              {editPlan
                ? (updatePlanMutation.isPending ? 'Saving...' : 'Save Changes')
                : (createPlanMutation.isPending ? 'Creating...' : 'Create Plan')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
