import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Phone,
  Mail,
  Edit,
  Trash2,
  User,
  Users,
  ShoppingBag,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Avatar,
  EmptyState,
  Skeleton,
} from '@warehousepos/ui';
import { formatCurrency, formatPhone } from '@warehousepos/utils';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Customer, CountryCode } from '@warehousepos/types';
import { CustomerForm } from '@/components/customers/CustomerForm';

export function CustomersPage() {
  const { tenant, store } = useAuthStore();
  const country: CountryCode = tenant?.country === 'NG' ? 'NG' : 'GH';
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Fetch customers
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', store?.id, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('customers')
        .select('*')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Customer deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete customer', { description: error.message });
    },
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsFormOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      deleteMutation.mutate(customer.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold text-foreground">
                {customers?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Customers</p>
              <p className="text-2xl font-bold text-foreground">
                {customers?.filter((c: any) => c.total_orders > 0).length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-2xl font-bold text-foreground">
                {customers?.filter((c: any) => {
                  const created = new Date(c.created_at);
                  const now = new Date();
                  return (
                    created.getMonth() === now.getMonth() &&
                    created.getFullYear() === now.getFullYear()
                  );
                }).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </Card>

      {/* Customers List */}
      {isLoading ? (
        <Card>
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-32 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : customers && customers.length > 0 ? (
        <Card>
          <div className="divide-y divide-border">
            {customers.map((customer: Customer) => (
              <div key={customer.id} className="p-4 flex items-center gap-4">
                <Avatar
                  name={customer.name || 'Customer'}
                  size="md"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{customer.name}</h3>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {formatPhone(customer.phone || '', tenant?.country || 'GH')}
                    </span>
                    {customer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {customer.email}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">
                    {formatCurrency(customer.total_spent || 0, country)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {customer.total_orders || 0} orders
                  </p>
                </div>
                {customer.loyalty_points && customer.loyalty_points > 0 && (
                  <Badge variant="secondary">
                    {customer.loyalty_points} points
                  </Badge>
                )}
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(customer)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(customer)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No customers found"
          description="Add your first customer to get started"
          icon={<Users className="w-12 h-12" />}
          action={{ label: 'Add Customer', onClick: () => setIsFormOpen(true) }}
        />
      )}

      {/* Customer Form Modal */}
      <Modal
        open={isFormOpen}
        onOpenChange={handleFormClose}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          customer={editingCustomer}
          onSuccess={handleFormClose}
        />
      </Modal>
    </div>
  );
}
