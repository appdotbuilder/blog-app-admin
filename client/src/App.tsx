import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BlogView } from '@/components/BlogView';
import { AdminPanel } from '@/components/AdminPanel';
import { Settings, BookOpen, Shield } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<string>('blog');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <BookOpen className="h-10 w-10 text-indigo-600" />
            📚 Modern Blog
          </h1>
          <p className="text-gray-600 text-lg">
            Discover amazing content and manage your blog with ease
          </p>
        </div>

        {/* Navigation Tabs */}
        <Card className="mb-8 shadow-lg border-0 bg-white/70 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-100">
                <TabsTrigger 
                  value="blog" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600"
                >
                  <BookOpen className="h-4 w-4" />
                  🌟 Public Blog
                </TabsTrigger>
                <TabsTrigger 
                  value="admin" 
                  className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-purple-600"
                >
                  <Shield className="h-4 w-4" />
                  ⚙️ Admin Panel
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
        </Card>

        {/* Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsContent value="blog" className="mt-0">
            <BlogView />
          </TabsContent>
          
          <TabsContent value="admin" className="mt-0">
            <AdminPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;