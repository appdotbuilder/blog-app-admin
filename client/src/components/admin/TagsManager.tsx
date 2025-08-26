import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Save, X, Tag } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { Tag as TagType, CreateTagInput, UpdateTagInput } from '../../../../server/src/schema';

export function TagsManager() {
  const [tags, setTags] = useState<TagType[]>([]);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateTagInput>({
    name: '',
    slug: ''
  });

  const loadTags = useCallback(async () => {
    try {
      setIsLoading(true);
      const tagsData = await trpc.getTags.query();
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const resetForm = () => {
    setFormData({
      name: '',
      slug: ''
    });
    setEditingTag(null);
    setIsCreating(false);
  };

  const handleEdit = (tag: TagType) => {
    setEditingTag(tag);
    setFormData({
      name: tag.name,
      slug: tag.slug
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
    setFormData((prev: CreateTagInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingTag) {
        const updateData: UpdateTagInput = {
          id: editingTag.id,
          ...formData
        };
        const updatedTag = await trpc.updateTag.mutate(updateData);
        setTags((prev: TagType[]) => 
          prev.map((tag: TagType) => tag.id === editingTag.id ? updatedTag : tag)
        );
      } else {
        const newTag = await trpc.createTag.mutate(formData);
        setTags((prev: TagType[]) => [newTag, ...prev]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save tag:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (tagId: number) => {
    try {
      await trpc.deleteTag.mutate({ id: tagId });
      setTags((prev: TagType[]) => prev.filter((tag: TagType) => tag.id !== tagId));
      setDeleteTagId(null);
    } catch (error) {
      console.error('Failed to delete tag:', error);
    }
  };

  if (isLoading && tags.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading tags... 🏷️</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingTag) && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Tag className="h-5 w-5 text-green-600" />
                {editingTag ? '✏️ Edit Tag' : '➕ Create New Tag'}
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
                  <Label htmlFor="name">Tag Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                    placeholder="e.g., JavaScript, Tutorial, Tips..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateTagInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="tag-url-slug"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : editingTag ? 'Update Tag' : 'Create Tag'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tags List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-green-600" />
              🏷️ Tags ({tags.length})
            </CardTitle>
            {!isCreating && !editingTag && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Tag
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tags created yet. Create your first tag to categorize your posts! 🏷️</p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-3">
                {tags.map((tag: TagType) => (
                  <div 
                    key={tag.id} 
                    className="group flex items-center gap-2 bg-white/70 hover:bg-white border rounded-full px-4 py-2 transition-colors"
                  >
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {tag.name}
                    </Badge>
                    <span className="text-xs text-gray-500">/{tag.slug}</span>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(tag)}
                        className="h-6 w-6 p-0 hover:bg-blue-100"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      
                      <AlertDialog open={deleteTagId === tag.id} onOpenChange={(open: boolean) => !open && setDeleteTagId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTagId(tag.id)}
                            className="h-6 w-6 p-0 hover:bg-red-100 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Tag</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete the tag "{tag.name}"? This action cannot be undone and may affect existing blog posts.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(tag.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Tag creation date info */}
              <div className="mt-6 pt-4 border-t">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Tag Details</h4>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {tags.map((tag: TagType) => (
                    <div key={tag.id} className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1">
                      <span className="font-medium">{tag.name}</span>
                      <span className="ml-2">
                        Created: {tag.created_at.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}