import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, FolderOpen, Tag } from 'lucide-react';
import { PostsManager } from '@/components/admin/PostsManager';
import { CategoriesManager } from '@/components/admin/CategoriesManager';
import { TagsManager } from '@/components/admin/TagsManager';

export function AdminPanel() {
  const [activeTab, setActiveTab] = useState<string>('posts');

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-3">
            <Shield className="h-8 w-8" />
            🛡️ Administrative Dashboard
          </CardTitle>
          <p className="text-purple-100">
            Manage your blog content, organize categories, and maintain tags
          </p>
        </CardHeader>
      </Card>

      {/* Admin Tabs */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100">
              <TabsTrigger 
                value="posts" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600"
              >
                <FileText className="h-4 w-4" />
                📝 Posts
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
              >
                <FolderOpen className="h-4 w-4" />
                📁 Categories
              </TabsTrigger>
              <TabsTrigger 
                value="tags" 
                className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-green-600"
              >
                <Tag className="h-4 w-4" />
                🏷️ Tags
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Tab Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsContent value="posts" className="mt-0">
          <PostsManager />
        </TabsContent>
        
        <TabsContent value="categories" className="mt-0">
          <CategoriesManager />
        </TabsContent>
        
        <TabsContent value="tags" className="mt-0">
          <TagsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}