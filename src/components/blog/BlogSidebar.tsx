import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { Calendar, Tag } from "lucide-react";

interface BlogSidebarProps {
  selectedCategory?: string;
  selectedTag?: string;
  onCategorySelect?: (category: string) => void;
  onTagSelect?: (tag: string) => void;
}

export function BlogSidebar({ 
  selectedCategory, 
  selectedTag,
  onCategorySelect,
  onTagSelect 
}: BlogSidebarProps) {
  // Fetch categories with post counts
  const { data: categories = [] } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('category')
        .eq('status', 'published');
      
      if (error) throw error;
      
      // Count posts per category
      const categoryCounts = data.reduce((acc: Record<string, number>, post) => {
        acc[post.category] = (acc[post.category] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(categoryCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
    },
  });

  // Fetch popular tags
  const { data: tags = [] } = useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('tags')
        .eq('status', 'published');
      
      if (error) throw error;
      
      // Flatten and count all tags
      const allTags = data.flatMap(post => post.tags || []);
      const tagCounts = allTags.reduce((acc: Record<string, number>, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      
      return Object.entries(tagCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    },
  });

  // Fetch recent posts
  const { data: recentPosts = [] } = useQuery({
    queryKey: ['blog-recent'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, cover_image, published_at, created_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Categorias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada</p>
          )}
          {categories.map((category) => (
            <Button
              key={category.name}
              variant={selectedCategory === category.name ? "default" : "ghost"}
              className="w-full justify-between"
              onClick={() => onCategorySelect?.(category.name)}
            >
              <span>{category.name}</span>
              <Badge variant="secondary">{category.count}</Badge>
            </Button>
          ))}
          {selectedCategory && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onCategorySelect?.('')}
            >
              Limpar filtro
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Popular Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tags Populares</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhuma tag encontrada</p>
            )}
            {tags.map((tag) => (
              <Badge
                key={tag.name}
                variant={selectedTag === tag.name ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => onTagSelect?.(tag.name)}
              >
                {tag.name} ({tag.count})
              </Badge>
            ))}
          </div>
          {selectedTag && (
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3"
              onClick={() => onTagSelect?.('')}
            >
              Limpar tag
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Recent Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Posts Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentPosts.length === 0 && (
            <p className="text-sm text-muted-foreground">Nenhum post encontrado</p>
          )}
          {recentPosts.map((post) => (
            <Link 
              key={post.id}
              to={`/blog/${post.slug}`}
              className="flex gap-3 group hover:bg-muted/50 p-2 rounded-lg transition-colors"
            >
              {post.cover_image && (
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-16 h-16 object-cover rounded"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                  {post.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(post.published_at || post.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
