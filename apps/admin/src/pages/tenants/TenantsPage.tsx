import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Building2, Search, Plus, ChevronRight, 
  CheckCircle,
  Download, MoreVertical, Mail, Phone
} from 'lucide-react';
import { Card, Input, Button, Badge, Select, EmptyState, Skeleton, Modal } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
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
  created_at: string;
  stores: { count: number }[];
  approved_at: string | null;
}

export function TenantsPage() {
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState<string>('all');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'suspend' | 'assign_plan' | null>(null);
  
  const queryClient = useQueryClient();

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants', countryFilter, statusFilter, subscriptionFilter],
    queryFn: async () => {
      let query = supabase
        .from('tenants')
        .select('*, stores:stores(count)')
        .order('created_at', { ascending: false });

      if (countryFilter !== 'all') {
        query = query.eq('country', countryFilter);
      }

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      } else if (statusFilter === 'pending') {
        query = query.is('approved_at', null);
      }

      if (subscriptionFilter !== 'all') {
        query = query.eq('subscription_status', subscriptionFilter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['tenant-stats'],
    queryFn: async () => {
      const [total, active, trial, ghana, nigeria] = await Promise.all([
        supabase.from('tenants').select('id', { count: 'exact' }),
        supabase.from('tenants').select('id', { count: 'exact' }).eq('is_active', true),
        supabase.from('tenants').select('id', { count: 'exact' }).eq('subscription_status', 'trial'),
        supabase.from('tenants').select('id', { count: 'exact' }).eq('country', 'GH'),
        supabase.from('tenants').select('id', { count: 'exact' }).eq('country', 'NG'),
      ]);
      return {
        total: total.count || 0,
        active: active.count || 0,
        trial: trial.count || 0,
        ghana: ghana.count || 0,
        nigeria: nigeria.count || 0,
      };
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          approved_at: new Date().toISOString(),
          is_active: true 
        })
        .eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tenant approved successfully');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setActionModal(null);
      setSelectedTenant(null);
    },
    onError: () => toast.error('Failed to approve tenant'),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ tenantId, reason }: { tenantId: string; reason: string }) => {
      const { error } = await supabase
        .from('tenants')
        .update({ 
          is_active: false,
          suspended_at: new Date().toISOString(),
          suspension_reason: reason
        })
        .eq('id', tenantId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Tenant suspended');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      setActionModal(null);
      setSelectedTenant(null);
    },
    onError: () => toast.error('Failed to suspend tenant'),
  });

  const filteredTenants = tenants?.filter((t: Tenant) =>
    t.business_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email?.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.includes(search)
  );

  const getStatusBadge = (tenant: Tenant) => {
    if (!tenant.is_active) {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (!tenant.approved_at) {
      return <Badge variant="warning">Pending Approval</Badge>;
    }
    switch (tenant.subscription_status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'trial':
        return <Badge variant="info">Trial</Badge>;
      case 'past_due':
        return <Badge variant="warning">Past Due</Badge>;
      case 'cancelled':
        return <Badge variant="secondary">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{tenant.subscription_status}</Badge>;
    }
  };

  const exportTenants = () => {
    if (!filteredTenants) return;
    const csv = [
      ['Business Name', 'Email', 'Phone', 'Country', 'Status', 'Plan', 'Created'],
      ...filteredTenants.map((t: Tenant) => [
        t.business_name,
        t.email,
        t.phone,
        t.country,
        t.is_active ? 'Active' : 'Inactive',
        t.subscription_tier,
        new Date(t.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tenants</h1>
          <p className="text-muted-foreground">Manage platform tenants</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={exportTenants}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Tenant
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold text-foreground">{stats?.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Active</p>
          <p className="text-2xl font-bold text-green-600">{stats?.active || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">On Trial</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.trial || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">🇬🇭 Ghana</p>
          <p className="text-2xl font-bold text-foreground">{stats?.ghana || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">🇳🇬 Nigeria</p>
          <p className="text-2xl font-bold text-foreground">{stats?.nigeria || 0}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search tenants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="sm:max-w-xs"
        />
        <div className="flex gap-3 flex-wrap">
          <Select
            value={countryFilter}
            onValueChange={setCountryFilter}
            options={[
              { value: 'all', label: 'All Countries' },
              { value: 'GH', label: '🇬🇭 Ghana' },
              { value: 'NG', label: '🇳🇬 Nigeria' },
            ]}
          />
          <Select
            value={statusFilter}
            onValueChange={setStatusFilter}
            options={[
              { value: 'all', label: 'All Status' },
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending Approval' },
            ]}
          />
          <Select
            value={subscriptionFilter}
            onValueChange={setSubscriptionFilter}
            options={[
              { value: 'all', label: 'All Plans' },
              { value: 'trial', label: 'Trial' },
              { value: 'active', label: 'Subscribed' },
              { value: 'past_due', label: 'Past Due' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      {/* Tenants List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : filteredTenants && filteredTenants.length > 0 ? (
        <div className="space-y-4">
          {filteredTenants.map((tenant: Tenant) => (
            <Card key={tenant.id} className="p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center justify-between">
                <Link to={`/tenants/${tenant.id}`} className="flex items-center gap-4 flex-1">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground">
                        {tenant.business_name}
                      </h3>
                      {getStatusBadge(tenant)}
                      {tenant.subscription_tier && tenant.subscription_tier !== 'free' && (
                        <Badge variant="outline" className="capitalize">
                          {tenant.subscription_tier}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      {tenant.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {tenant.email}
                        </span>
                      )}
                      {tenant.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {tenant.phone}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tenant.country === 'GH' ? '🇬🇭' : '🇳🇬'} • {tenant.stores?.[0]?.count || 0} stores • Created {formatDate(tenant.created_at, 'short')}
                      {tenant.trial_ends_at && tenant.subscription_status === 'trial' && (
                        <span className="text-orange-500 ml-2">
                          Trial ends {formatDate(tenant.trial_ends_at, 'short')}
                        </span>
                      )}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  {!tenant.approved_at && tenant.is_active && (
                    <Button 
                      size="sm" 
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedTenant(tenant);
                        setActionModal('approve');
                      }}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      setSelectedTenant(tenant);
                      setActionModal('suspend');
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  <Link to={`/tenants/${tenant.id}`}>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tenants found"
          description={search ? `No tenants match "${search}"` : 'No tenants yet'}
          icon={<Building2 className="w-12 h-12" />}
        />
      )}

      {/* Approve Modal */}
      <Modal
        open={actionModal === 'approve'}
        onOpenChange={() => { setActionModal(null); setSelectedTenant(null); }}
        title="Approve Tenant"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Are you sure you want to approve <strong>{selectedTenant?.business_name}</strong>?
            They will be able to fully use the platform.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setActionModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={() => selectedTenant && approveMutation.mutate(selectedTenant.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? 'Approving...' : 'Approve Tenant'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal
        open={actionModal === 'suspend'}
        onOpenChange={() => { setActionModal(null); setSelectedTenant(null); }}
        title={selectedTenant?.is_active ? "Suspend Tenant" : "Reactivate Tenant"}
      >
        <div className="space-y-4">
          {selectedTenant?.is_active ? (
            <>
              <p className="text-muted-foreground">
                Are you sure you want to suspend <strong>{selectedTenant?.business_name}</strong>?
                They will lose access to the platform.
              </p>
              <textarea
                className="w-full p-3 border rounded-lg"
                placeholder="Reason for suspension (optional)"
                rows={3}
                id="suspendReason"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    const reason = (document.getElementById('suspendReason') as HTMLTextAreaElement)?.value;
                    selectedTenant && suspendMutation.mutate({ tenantId: selectedTenant.id, reason });
                  }}
                  disabled={suspendMutation.isPending}
                >
                  {suspendMutation.isPending ? 'Suspending...' : 'Suspend Tenant'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted-foreground">
                Reactivate <strong>{selectedTenant?.business_name}</strong>?
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setActionModal(null)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => selectedTenant && approveMutation.mutate(selectedTenant.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? 'Reactivating...' : 'Reactivate'}
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
