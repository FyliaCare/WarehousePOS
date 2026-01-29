import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, GripVertical, Layers } from 'lucide-react';
import {
  Button,
  Input,
  Card,
  Badge,
  Modal,
  EmptyState,
  Skeleton,
} from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Category } from '@warehousepos/types';
import { CategoryForm } from '@/components/products/CategoryForm';

export function CategoriesPage() {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Fetch categories
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', store?.id, searchQuery],
    queryFn: async () => {
      if (!store?.id) return [];
      let query = supabase
        .from('categories')
        .select('*, _count:products(count)')
        .eq('store_id', store.id);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data } = await query.order('sort_order');
      return data || [];
    },
    enabled: !!store?.id,
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if category has products
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);

      if (count && count > 0) {
        throw new Error('Cannot delete category with products. Move products first.');
      }

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to delete category', { description: error.message });
    },
  });

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete "${category.name}"?`)) {
      deleteMutation.mutate(category.id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <Input
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-5 h-5" />}
        />
      </Card>

      {/* Categories List */}
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
      ) : categories && categories.length > 0 ? (
        <Card>
          <div className="divide-y divide-border">
            {categories.map((category: any) => (
              <div
                key={category.id}
                className="p-4 flex items-center gap-4"
              >
                <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                >
                  <span className="text-lg">{category.icon || '📦'}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>
                <Badge variant="secondary">
                  {category._count?.[0]?.count || 0} products
                </Badge>
                <Badge variant={category.is_active ? 'success' : 'secondary'}>
                  {category.is_active ? 'Active' : 'Inactive'}
                </Badge>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category)}
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
          title="No categories found"
          description="Create categories to organize your products"
          icon={<Layers className="w-12 h-12" />}
          action={{ label: 'Add Category', onClick: () => setIsFormOpen(true) }}
        />
      )}

      {/* Category Form Modal */}
      <Modal
        open={isFormOpen}
        onOpenChange={handleFormClose}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <CategoryForm
          category={editingCategory}
          onSuccess={handleFormClose}
        />
      </Modal>
    </div>
  );
}
