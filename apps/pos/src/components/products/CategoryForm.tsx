import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button, Input, Switch } from '@warehousepos/ui';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import type { Category } from '@warehousepos/types';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
  isActive: boolean;
}

const CATEGORY_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e',
];

const CATEGORY_ICONS = [
  '📦', '🍔', '🥤', '🍞', '🥛', '🧀', '🥩', '🍗', '🐟', '🥬',
  '🍎', '🍊', '🍋', '🫒', '🥚', '🍫', '🍪', '☕', '🧃', '🍺',
  '🧴', '🧹', '💊', '🎁', '👕', '👟', '📱', '💻', '🔧', '🏠',
];

export function CategoryForm({ category, onSuccess }: CategoryFormProps) {
  const { store } = useAuthStore();
  const queryClient = useQueryClient();
  const isEditing = !!category;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    defaultValues: category
      ? {
          name: category.name,
          description: category.description || '',
          color: category.color || '#6366f1',
          icon: category.icon || '📦',
          isActive: category.is_active,
        }
      : {
          name: '',
          description: '',
          color: '#6366f1',
          icon: '📦',
          isActive: true,
        },
  });

  const selectedColor = watch('color');
  const selectedIcon = watch('icon');
  const isActive = watch('isActive');

  const mutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description || null,
            color: data.color,
            icon: data.icon,
            is_active: data.isActive,
          } as never)
          .eq('id', category.id);
        if (error) throw error;
      } else {
        // Get max sort order
        const { data: existing } = await supabase
          .from('categories')
          .select('sort_order')
          .eq('store_id', store!.id)
          .order('sort_order', { ascending: false })
          .limit(1);

        const sortOrder = existing && existing.length > 0 ? ((existing[0] as any).sort_order || 0) + 1 : 0;

        const { error } = await supabase.from('categories').insert({
          store_id: store?.id,
          name: data.name,
          description: data.description || null,
          color: data.color,
          icon: data.icon,
          is_active: data.isActive,
          sort_order: sortOrder,
        } as never);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(isEditing ? 'Category updated!' : 'Category created!');
      onSuccess();
    },
    onError: (error: any) => {
      toast.error('Error saving category', { description: error.message });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    mutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Category Name"
        placeholder="e.g., Beverages"
        error={errors.name?.message}
        {...register('name', { required: 'Name is required' })}
      />

      <Input
        label="Description (optional)"
        placeholder="Brief description..."
        error={errors.description?.message}
        {...register('description')}
      />

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Icon
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg max-h-32 overflow-y-auto">
          {CATEGORY_ICONS.map((icon) => (
            <button
              key={icon}
              type="button"
              onClick={() => setValue('icon', icon)}
              className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                selectedIcon === icon
                  ? 'bg-primary ring-2 ring-primary ring-offset-2'
                  : 'bg-background hover:bg-muted-foreground/10'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Color
        </label>
        <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
          {CATEGORY_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('color', color)}
              className={`w-8 h-8 rounded-full transition-all ${
                selectedColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground mb-2">Preview</p>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: selectedColor }}
          >
            {selectedIcon}
          </div>
          <span className="font-medium text-foreground">
            {watch('name') || 'Category Name'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div>
          <p className="font-medium text-foreground">Active</p>
          <p className="text-sm text-muted-foreground">
            Category is visible in the POS
          </p>
        </div>
        <Switch
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onSuccess}
        >
          Cancel
        </Button>
        <Button type="submit" className="flex-1" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isEditing ? (
            'Update Category'
          ) : (
            'Add Category'
          )}
        </Button>
      </div>
    </form>
  );
}
