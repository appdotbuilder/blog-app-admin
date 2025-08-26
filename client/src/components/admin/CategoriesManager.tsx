import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, FolderOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../../server/src/schema';

export function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteCategoryId, setDeleteCategoryId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    slug: '',
    description: null
  });

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const categoriesData = await trpc.getCategories.query();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: null
    });
    setEditingCategory(null);
    setIsCreating(false);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev: CreateCategoryInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingCategory) {
        const updateData: UpdateCategoryInput = {
          id: editingCategory.id,
          ...formData
        };
        const updatedCategory = await trpc.updateCategory.mutate(updateData);
        setCategories((prev: Category[]) => 
          prev.map((category: Category) => category.id === editingCategory.id ? updatedCategory : category)
        );
      } else {
        const newCategory = await trpc.createCategory.mutate(formData);
        setCategories((prev: Category[]) => [newCategory, ...prev]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    try {
      await trpc.deleteCategory.mutate({ id: categoryId });
      setCategories((prev: Category[]) => prev.filter((category: Category) => category.id !== categoryId));
      setDeleteCategoryId(null);
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  if (isLoading && categories.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading categories... 📁</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingCategory) && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-indigo-600" />
                {editingCategory ? '✏️ Edit Category' : '➕ Create New Category'}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetForm}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                    placeholder="e.g., Technology, Travel, Food..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCategoryInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="category-url-slug"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateCategoryInput) => ({ 
                      ...prev, 
                      description: e.target.value || null 
                    }))
                  }
                  placeholder="Brief description of this category..."
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              📁 Categories ({categories.length})
            </CardTitle>
            {!isCreating && !editingCategory && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Category
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No categories created yet. Create your first category to organize your posts! 🗂️</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {categories.map((category: Category) => (
                <div key={category.id} className="border rounded-lg p-4 bg-white/50 hover:bg-white/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">{category.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          /{category.slug}
                        </Badge>
                      </div>
                      
                      {category.description && (
                        <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Created: {category.created_at.toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(category)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <AlertDialog open={deleteCategoryId === category.id} onOpenChange={(open: boolean) => !open && setDeleteCategoryId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeleteCategoryId(category.id)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Category</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the category "{category.name}"? This action cannot be undone and may affect existing blog posts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(category.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}