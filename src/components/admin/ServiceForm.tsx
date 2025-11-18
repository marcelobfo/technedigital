import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres"),
  short_description: z.string().min(10, "Descrição curta deve ter no mínimo 10 caracteres"),
  full_description: z.string().min(20, "Descrição completa deve ter no mínimo 20 caracteres"),
  icon: z.string().optional(),
  is_featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']),
  display_order: z.number().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface ServiceFormProps {
  service?: any;
  onSuccess: () => void;
}

export default function ServiceForm({ service, onSuccess }: ServiceFormProps) {
  const [features, setFeatures] = useState<string[]>(service?.features || []);
  const [newFeature, setNewFeature] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: service?.title || "",
      slug: service?.slug || "",
      short_description: service?.short_description || "",
      full_description: service?.full_description || "",
      icon: service?.icon || "",
      is_featured: service?.is_featured || false,
      status: service?.status || "active",
      display_order: service?.display_order || 0,
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const serviceData = {
        title: data.title,
        slug: data.slug,
        short_description: data.short_description,
        full_description: data.full_description,
        icon: data.icon || null,
        features: features,
        is_featured: data.is_featured,
        status: data.status,
        display_order: data.display_order,
      };

      if (service?.id) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', service.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast({ title: "Serviço salvo com sucesso!" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar serviço",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFeatures([...features, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFeatures(features.filter((_, i) => i !== index));
  };

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            {...register("title")}
            onBlur={(e) => {
              if (!service) {
                setValue("slug", generateSlug(e.target.value));
              }
            }}
          />
          {errors.title && (
            <p className="text-sm text-destructive">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug *</Label>
          <Input id="slug" {...register("slug")} />
          {errors.slug && (
            <p className="text-sm text-destructive">{errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="short_description">Descrição Curta *</Label>
        <Textarea id="short_description" {...register("short_description")} rows={3} />
        {errors.short_description && (
          <p className="text-sm text-destructive">{errors.short_description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_description">Descrição Completa *</Label>
        <Textarea id="full_description" {...register("full_description")} rows={6} />
        {errors.full_description && (
          <p className="text-sm text-destructive">{errors.full_description.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="icon">Ícone (emoji ou texto)</Label>
        <Input id="icon" {...register("icon")} placeholder="🎨" />
      </div>

      <div className="space-y-2">
        <Label>Recursos/Características</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Adicionar novo recurso"
            value={newFeature}
            onChange={(e) => setNewFeature(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
          />
          <Button type="button" variant="outline" onClick={addFeature}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        {features.length > 0 && (
          <div className="space-y-2 mt-3">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md border p-2">
                <span className="flex-1 text-sm">{feature}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFeature(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watch("status")}
            onValueChange={(value: any) => setValue("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="inactive">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="display_order">Ordem de Exibição</Label>
          <Input
            id="display_order"
            type="number"
            {...register("display_order", { valueAsNumber: true })}
          />
        </div>

        <div className="flex items-center space-x-2 pt-8">
          <Checkbox
            id="is_featured"
            checked={watch("is_featured")}
            onCheckedChange={(checked) => setValue("is_featured", checked as boolean)}
          />
          <Label htmlFor="is_featured" className="cursor-pointer">
            Serviço em destaque
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="submit"
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {service ? "Atualizar" : "Criar"} Serviço
        </Button>
      </div>
    </form>
  );
}
