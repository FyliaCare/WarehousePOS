import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, Search, Mail } from 'lucide-react';
import { Card, Input, Badge, Select, EmptyState, Skeleton, Avatar } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', roleFilter],
    queryFn: async () => {
      let query = supabase
        .from('users')
        .select('*, tenant:tenants(business_name)')
        .order('created_at', { ascending: false });

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const filteredUsers = users?.filter((u: any) =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'destructive';
      case 'owner': return 'default';
      case 'manager': return 'info';
      case 'cashier': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">All platform users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="sm:max-w-xs"
        />
        <Select
          value={roleFilter}
          onValueChange={setRoleFilter}
          options={[
            { value: 'all', label: 'All Roles' },
            { value: 'super_admin', label: 'Super Admin' },
            { value: 'owner', label: 'Owner' },
            { value: 'manager', label: 'Manager' },
            { value: 'cashier', label: 'Cashier' },
          ]}
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : filteredUsers && filteredUsers.length > 0 ? (
        <div className="space-y-4">
          {filteredUsers.map((user: any) => (
            <Card key={user.id} className="p-4">
              <div className="flex items-center gap-4">
                <Avatar name={user.full_name || 'User'} size="lg" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{user.full_name}</h3>
                    <Badge variant={getRoleColor(user.role)}>{user.role}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    {user.email}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {user.tenant?.business_name || 'No tenant'} • Joined {formatDate(user.created_at, 'short')}
                  </p>
                </div>
                <Badge variant={user.is_active ? 'success' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No users found"
          description={search ? `No users match "${search}"` : 'No users yet'}
          icon={<Users className="w-12 h-12" />}
        />
      )}
    </div>
  );
}
