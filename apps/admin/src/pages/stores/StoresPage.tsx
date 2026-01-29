import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Store, Search, ChevronRight } from 'lucide-react';
import { Card, Input, Badge, Select, EmptyState, Skeleton } from '@warehousepos/ui';
import { formatDate } from '@warehousepos/utils';
import { supabase } from '@/lib/supabase';

export function StoresPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: stores, isLoading } = useQuery({
    queryKey: ['stores', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('stores')
        .select('*, tenant:tenants(business_name, country)')
        .order('created_at', { ascending: false });

      if (statusFilter === 'active') {
        query = query.eq('is_active', true);
      } else if (statusFilter === 'inactive') {
        query = query.eq('is_active', false);
      }

      const { data } = await query;
      return data || [];
    },
  });

  const filteredStores = stores?.filter((s: any) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Stores</h1>
        <p className="text-muted-foreground">All stores across all tenants</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
          className="sm:max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </div>

      {/* Stores List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-4">
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>
      ) : filteredStores && filteredStores.length > 0 ? (
        <div className="space-y-4">
          {filteredStores.map((store: any) => (
            <Link key={store.id} to={`/stores/${store.id}`}>
              <Card className="p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Store className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{store.name}</h3>
                        <Badge variant={store.is_active ? 'success' : 'secondary'}>
                          {store.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {store.slug}.warehousepos.com
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {store.tenant?.business_name} • {store.tenant?.country === 'GH' ? '🇬🇭' : '🇳🇬'} • {formatDate(store.created_at, 'short')}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No stores found"
          description={search ? `No stores match "${search}"` : 'No stores yet'}
          icon={<Store className="w-12 h-12" />}
        />
      )}
    </div>
  );
}
