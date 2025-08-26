import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Search, Calendar, User, Tag, BookOpen } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { BlogPost, Category, Tag as TagType } from '../../../server/src/schema';

export function BlogView() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [postsData, categoriesData, tagsData] = await Promise.all([
        trpc.getPublishedBlogPosts.query({}),
        trpc.getCategories.query(),
        trpc.getTags.query()
      ]);
      
      setPosts(postsData);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load blog data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredPosts = posts.filter((post: BlogPost) => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || 
                           (selectedCategory === 'uncategorized' && !post.category_id) ||
                           post.category_id === parseInt(selectedCategory);
    
    // Note: Tag filtering would need post-tag relationships from the API
    // For now, we'll just filter by category and search
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading amazing content... ✨</p>
        </div>
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="space-y-6">
        <Button 
          onClick={() => setSelectedPost(null)}
          variant="outline"
          className="mb-4"
        >
          ← Back to Blog
        </Button>
        
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
              <Calendar className="h-4 w-4" />
              {selectedPost.publication_date?.toLocaleDateString() || 'Draft'}
              <User className="h-4 w-4 ml-4" />
              {selectedPost.author}
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 leading-tight">
              {selectedPost.title}
            </CardTitle>
            {selectedPost.excerpt && (
              <p className="text-lg text-gray-600 italic">
                {selectedPost.excerpt}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="prose prose-lg max-w-none">
              <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                {selectedPost.content}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="h-5 w-5 text-indigo-600" />
            🔍 Discover Content
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Search posts</label>
              <Input
                placeholder="Search titles, content..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="bg-white/50"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  {categories.map((category: Category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tag</label>
              <Select value={selectedTag} onValueChange={setSelectedTag}>
                <SelectTrigger className="bg-white/50">
                  <SelectValue placeholder="All tags" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {tags.map((tag: TagType) => (
                    <SelectItem key={tag.id} value={tag.id.toString()}>
                      {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Blog Posts */}
      {filteredPosts.length === 0 ? (
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="py-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No posts found</h3>
            <p className="text-gray-500">
              {searchTerm || selectedCategory !== 'all' || selectedTag !== 'all' 
                ? "Try adjusting your filters to find more content 🔍" 
                : "No published posts available yet. Check back soon! 📝"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map((post: BlogPost) => (
            <Card 
              key={post.id} 
              className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-shadow cursor-pointer group"
              onClick={() => setSelectedPost(post)}
            >
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-4 w-4" />
                    {post.publication_date?.toLocaleDateString() || 'Draft'}
                    <User className="h-4 w-4 ml-4" />
                    {post.author}
                  </div>
                  {post.published && (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      ✅ Published
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {post.title}
                </CardTitle>
                {post.excerpt && (
                  <p className="text-gray-600">
                    {post.excerpt}
                  </p>
                )}
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 line-clamp-3">
                  {post.content.slice(0, 200)}...
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {post.category_id && categories.find((cat: Category) => cat.id === post.category_id) && (
                      <Badge variant="outline" className="text-xs">
                        🏷️ {categories.find((cat: Category) => cat.id === post.category_id)?.name}
                      </Badge>
                    )}
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700"
                  >
                    Read more →
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}