import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Calendar, User, Save, X, FileText } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { BlogPost, Category, Tag, CreateBlogPostInput, UpdateBlogPostInput } from '../../../../server/src/schema';

export function PostsManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deletePostId, setDeletePostId] = useState<number | null>(null);

  const [formData, setFormData] = useState<CreateBlogPostInput>({
    title: '',
    content: '',
    slug: '',
    excerpt: null,
    published: false,
    publication_date: null,
    category_id: null,
    author: '',
    tag_ids: []
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [postsData, categoriesData, tagsData] = await Promise.all([
        trpc.getBlogPosts.query({}),
        trpc.getCategories.query(),
        trpc.getTags.query()
      ]);
      
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      slug: '',
      excerpt: null,
      published: false,
      publication_date: null,
      category_id: null,
      author: '',
      tag_ids: []
    });
    setEditingPost(null);
    setIsCreating(false);
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      slug: post.slug,
      excerpt: post.excerpt,
      published: post.published,
      publication_date: post.publication_date,
      category_id: post.category_id,
      author: post.author,
      tag_ids: [] // Would need to fetch post-tag relationships
    });
    setIsCreating(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreating(true);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateBlogPostInput) => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (editingPost) {
        const updateData: UpdateBlogPostInput = {
          id: editingPost.id,
          ...formData
        };
        const updatedPost = await trpc.updateBlogPost.mutate(updateData);
        setPosts((prev: BlogPost[]) => 
          prev.map((post: BlogPost) => post.id === editingPost.id ? updatedPost : post)
        );
      } else {
        const newPost = await trpc.createBlogPost.mutate(formData);
        setPosts((prev: BlogPost[]) => [newPost, ...prev]);
      }
      resetForm();
    } catch (error) {
      console.error('Failed to save post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (postId: number) => {
    try {
      await trpc.deleteBlogPost.mutate({ id: postId });
      setPosts((prev: BlogPost[]) => prev.filter((post: BlogPost) => post.id !== postId));
      setDeletePostId(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  if (isLoading && posts.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading posts... 📝</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingPost) && (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                {editingPost ? '✏️ Edit Post' : '➕ Create New Post'}
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
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
                    placeholder="Enter post title..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author">Author *</Label>
                  <Input
                    id="author"
                    value={formData.author}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({ ...prev, author: e.target.value }))
                    }
                    placeholder="Author name..."
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateBlogPostInput) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="post-url-slug"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateBlogPostInput) => ({ 
                      ...prev, 
                      excerpt: e.target.value || null 
                    }))
                  }
                  placeholder="Brief description of the post..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateBlogPostInput) => ({ ...prev, content: e.target.value }))
                  }
                  placeholder="Write your post content here..."
                  rows={10}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category_id?.toString() || 'none'} 
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateBlogPostInput) => ({ 
                        ...prev, 
                        category_id: value === 'none' ? null : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publication_date">Publication Date</Label>
                  <Input
                    id="publication_date"
                    type="datetime-local"
                    value={formData.publication_date ? 
                      new Date(formData.publication_date.getTime() - formData.publication_date.getTimezoneOffset() * 60000)
                        .toISOString().slice(0, 16) : ''
                    }
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateBlogPostInput) => ({ 
                        ...prev, 
                        publication_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="published">Published</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="published"
                      checked={formData.published}
                      onCheckedChange={(checked: boolean) =>
                        setFormData((prev: CreateBlogPostInput) => ({ ...prev, published: checked }))
                      }
                    />
                    <Label htmlFor="published" className="text-sm">
                      {formData.published ? 'Published ✅' : 'Draft 📝'}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={isLoading} className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : editingPost ? 'Update Post' : 'Create Post'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Posts List */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-purple-600" />
              📝 Blog Posts ({posts.length})
            </CardTitle>
            {!isCreating && !editingPost && (
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No blog posts created yet. Start by creating your first post! ✨</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post: BlogPost) => (
                <div key={post.id} className="border rounded-lg p-4 bg-white/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{post.title}</h3>
                        <Badge variant={post.published ? 'default' : 'secondary'}>
                          {post.published ? '✅ Published' : '📝 Draft'}
                        </Badge>
                      </div>
                      
                      {post.excerpt && (
                        <p className="text-gray-600 text-sm mb-2">{post.excerpt}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.author}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {post.publication_date?.toLocaleDateString() || 'No date'}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 line-clamp-2">
                        {post.content.slice(0, 150)}...
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(post)}
                        className="flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Edit
                      </Button>
                      
                      <AlertDialog open={deletePostId === post.id} onOpenChange={(open: boolean) => !open && setDeletePostId(null)}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setDeletePostId(post.id)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{post.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(post.id)}
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