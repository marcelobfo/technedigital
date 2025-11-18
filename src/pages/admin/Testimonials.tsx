import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import TestimonialCard from "@/components/admin/TestimonialCard";
import TestimonialForm from "@/components/admin/TestimonialForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Testimonials() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading } = useQuery({
    queryKey: ['testimonials', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('testimonials')
        .select('*')
        .order('display_order', { ascending: true });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as 'active' | 'inactive');
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('testimonials')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: "Depoimento deletado com sucesso!" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao deletar depoimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEdit = (testimonial: any) => {
    setEditingTestimonial(testimonial);
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja deletar este depoimento?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTestimonial(null);
  };

  const filteredTestimonials = testimonials?.filter(testimonial =>
    testimonial.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    testimonial.client_company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Depoimentos</h1>
          <p className="text-muted-foreground">Gerencie os depoimentos de clientes</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Depoimento
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar depoimentos..."
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
            <SelectItem value="active">Ativo</SelectItem>
            <SelectItem value="inactive">Inativo</SelectItem>
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
          {filteredTestimonials?.map((testimonial) => (
            <TestimonialCard
              key={testimonial.id}
              testimonial={testimonial}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {filteredTestimonials?.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">Nenhum depoimento encontrado</p>
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Editar Depoimento" : "Novo Depoimento"}
            </DialogTitle>
          </DialogHeader>
          <TestimonialForm
            testimonial={editingTestimonial}
            onSuccess={handleCloseForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
