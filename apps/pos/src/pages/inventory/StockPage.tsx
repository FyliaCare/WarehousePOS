import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Minus,
  Search,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  Select,
  EmptyState,
  Skeleton,
} from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { StockMovementType } from '@warehousepos/types';

export function StockPage() {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');

  // Fetch stock levels
  const { data: stockLevels, isLoading } = useQuery({
    queryKey: ['stock-levels', store?.id, searchQuery, stockFilter],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('stock_levels')
        .select('*, product:products(name, sku, cost_price, selling_price, image_url)')
        .eq('store_id', store.id);

      if (stockFilter === 'low') {
        query = query.lte('quantity', 10).gt('quantity', 0);
      } else if (stockFilter === 'out') {
        query = query.eq('quantity', 0);
      }

      const { data } = await query.order('quantity', { ascending: true });

      // Filter by search query
      if (searchQuery && data) {
        return data.filter(
          (item: any) =>
            item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      return data || [];
    },
    enabled: !!store?.id,
  });

  // Stock adjustment mutation
  const adjustStockMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
      type,
      reason,
    }: {
      productId: string;
      quantity: number;
      type: 'add' | 'remove';
      reason: string;
    }) => {
      if (!store?.id) throw new Error('Store not found');
      
      // Create stock movement - use 'adjustment' type for manual adjustments
      const movementType: StockMovementType = 'adjustment';

      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert({
          store_id: store.id,
          product_id: productId,
          type: movementType,
          quantity: type === 'add' ? quantity : -quantity,
          notes: `${type === 'add' ? 'Stock increase' : 'Stock decrease'}: ${reason}`,
        } as never);

      if (movementError) throw movementError;

      // Update stock level
      const { data: currentStock } = await supabase
        .from('stock_levels')
        .select('quantity')
        .eq('store_id', store.id)
        .eq('product_id', productId)
        .single();

      const currentQty = ((currentStock as any)?.quantity ?? 0) as number;
      const newQuantity =
        type === 'add'
          ? currentQty + quantity
          : currentQty - quantity;

      const { error: updateError } = await supabase
        .from('stock_levels')
        .upsert({
          store_id: store.id,
          product_id: productId,
          quantity: Math.max(0, newQuantity),
        } as never);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-levels'] });
      toast.success('Stock adjusted successfully');
      handleCloseAdjustModal();
    },
    onError: (error: any) => {
      toast.error('Failed to adjust stock', { description: error.message });
    },
  });

  const handleOpenAdjustModal = (product: any, type: 'add' | 'remove') => {
    setSelectedProduct(product);
    setAdjustmentType(type);
    setAdjustmentQuantity('');
    setAdjustmentReason('');
    setIsAdjustModalOpen(true);
  };

  const handleCloseAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAdjustStock = () => {
    const quantity = parseInt(adjustmentQuantity);
    if (!quantity || quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (adjustmentType === 'remove' && quantity > selectedProduct.quantity) {
      toast.error('Cannot remove more than current stock');
      return;
    }

    adjustStockMutation.mutate({
      productId: selectedProduct.product_id,
      quantity,
      type: adjustmentType,
      reason: adjustmentReason,
    });
  };

  const getStockBadge = (quantity: number) => {
    if (quantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    } else if (quantity <= 10) {
      return <Badge variant="warning">Low Stock</Badge>;
    }
    return <Badge variant="success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stock Management</h1>
          <p className="text-muted-foreground">
            Track and manage your inventory levels
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold text-foreground">
                {stockLevels?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Low Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {stockLevels?.filter((s: any) => s.quantity > 0 && s.quantity <= 10).length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Out of Stock</p>
              <p className="text-2xl font-bold text-foreground">
                {stockLevels?.filter((s: any) => s.quantity === 0).length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-5 h-5" />}
            />
          </div>
          <Select
            value={stockFilter}
            onValueChange={(v) => setStockFilter(v as any)}
            options={[
              { value: 'all', label: 'All Products' },
              { value: 'low', label: 'Low Stock' },
              { value: 'out', label: 'Out of Stock' },
            ]}
          />
        </div>
      </Card>

      {/* Stock List */}
      {isLoading ? (
        <Card>
          <div className="divide-y divide-border">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </Card>
      ) : stockLevels && stockLevels.length > 0 ? (
        <Card>
          <div className="divide-y divide-border">
            {stockLevels.map((item: any) => (
              <div key={item.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {item.product?.image_url ? (
                    <img
                      src={item.product.image_url}
                      alt={item.product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground truncate">
                    {item.product?.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    SKU: {item.product?.sku}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{item.quantity}</p>
                  <p className="text-xs text-muted-foreground">units</p>
                </div>
                {getStockBadge(item.quantity)}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAdjustModal(item, 'add')}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAdjustModal(item, 'remove')}
                    disabled={item.quantity === 0}
                  >
                    <Minus className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <EmptyState
          title="No products found"
          description="Add products to start tracking stock"
          icon={<Package className="w-12 h-12" />}
        />
      )}

      {/* Stock Adjustment Modal */}
      <Modal
        open={isAdjustModalOpen}
        onOpenChange={handleCloseAdjustModal}
        title={`${adjustmentType === 'add' ? 'Add' : 'Remove'} Stock`}
      >
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="font-medium text-foreground">
              {selectedProduct?.product?.name}
            </p>
            <p className="text-sm text-muted-foreground">
              Current Stock: {selectedProduct?.quantity} units
            </p>
          </div>

          <Input
            label="Quantity"
            type="number"
            min="1"
            value={adjustmentQuantity}
            onChange={(e) => setAdjustmentQuantity(e.target.value)}
            placeholder="Enter quantity"
          />

          <Input
            label="Reason (optional)"
            value={adjustmentReason}
            onChange={(e) => setAdjustmentReason(e.target.value)}
            placeholder="e.g., New shipment, Damaged goods"
          />

          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={handleCloseAdjustModal}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAdjustStock}
              disabled={adjustStockMutation.isPending}
            >
              {adjustmentType === 'add' ? (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Add Stock
                </>
              ) : (
                <>
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Remove Stock
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
