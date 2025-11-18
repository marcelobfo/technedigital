import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BlogPostCard from "@/components/admin/BlogPostCard";
import BlogPostForm from "@/components/admin/BlogPostForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function BlogPosts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'draft' | 'published' | 'archived');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: "Post deletado com sucesso!" });
    },
    onError: (error) => {
      toast({ 
        title: "Erro ao deletar post", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este post?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingPost(null);
  };

  const filteredPosts = posts?.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-muted-foreground">Gerencie seus artigos do blog</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Post
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="draft">Rascunho</SelectItem>
            <SelectItem value="published">Publicado</SelectItem>
            <SelectItem value="archived">Arquivado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPosts?.map((post) => (
            <BlogPostCard
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {filteredPosts?.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum post encontrado</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? "Editar Post" : "Novo Post"}
            </DialogTitle>
          </DialogHeader>
          <BlogPostForm
            post={editingPost}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
