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
import { Loader2 } from "lucide-react";

const formSchema = z.object({
  title: z.string().min(3, "Título deve ter no mínimo 3 caracteres"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres"),
  description: z.string().min(10, "Descrição deve ter no mínimo 10 caracteres"),
  client_name: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  results: z.string().optional(),
  technologies: z.string().optional(),
  tags: z.string().optional(),
  project_url: z.string().optional(),
  is_featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']),
  display_order: z.number().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface ProjectFormProps {
  project?: any;
  onSuccess: () => void;
}

export default function ProjectForm({ project, onSuccess }: ProjectFormProps) {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(project?.cover_image || "");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: project?.title || "",
      slug: project?.slug || "",
      description: project?.description || "",
      client_name: project?.client_name || "",
      challenge: project?.challenge || "",
      solution: project?.solution || "",
      results: project?.results || "",
      technologies: project?.technologies?.join(", ") || "",
      tags: project?.tags?.join(", ") || "",
      project_url: project?.project_url || "",
      is_featured: project?.is_featured || false,
      status: project?.status || "active",
      display_order: project?.display_order || 0,
    },
  });

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('portfolio-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let imageUrl = coverImageUrl;

      if (coverImage) {
        setUploading(true);
        imageUrl = await uploadImage(coverImage);
        setUploading(false);
      }

      const projectData = {
        title: data.title,
        slug: data.slug,
        description: data.description,
        client_name: data.client_name || null,
        challenge: data.challenge || null,
        solution: data.solution || null,
        results: data.results || null,
        technologies: data.technologies ? data.technologies.split(',').map(t => t.trim()) : [],
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        project_url: data.project_url || null,
        cover_image: imageUrl || null,
        is_featured: data.is_featured,
        status: data.status,
        display_order: data.display_order,
      };

      let projectId = project?.id;

      if (project?.id) {
        const { error } = await supabase
          .from('portfolio_projects')
          .update(projectData)
          .eq('id', project.id);
        if (error) throw error;
      } else {
        const { data: newProject, error } = await supabase
          .from('portfolio_projects')
          .insert([projectData])
          .select()
          .single();
        if (error) throw error;
        projectId = newProject.id;
      }

      return { projectData, projectId };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-projects'] });
      toast({ title: "Projeto salvo com sucesso!" });

      // Auto-submit para Google Search Console se ativo
      if (result.projectData.status === 'active') {
        try {
          const { data: gscSettings } = await supabase
            .from('google_search_console_settings')
            .select('auto_submit_on_publish, is_active')
            .single();

          if (gscSettings?.is_active && gscSettings?.auto_submit_on_publish) {
            await supabase.functions.invoke('auto-submit-new-content', {
              body: {
                url: `https://technedigital.com.br/portfolio/${result.projectData.slug}`,
                type: 'portfolio',
                reference_id: result.projectId
              }
            });
            console.log('Projeto submetido ao Google Search Console');
          }
        } catch (error) {
          console.error('Erro ao submeter ao Google:', error);
          // Não bloqueia o sucesso do projeto
        }
      }

      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar projeto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverImage(e.target.files[0]);
      setCoverImageUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
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
              if (!project) {
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
        <Label htmlFor="description">Descrição *</Label>
        <Textarea id="description" {...register("description")} rows={4} />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nome do Cliente</Label>
          <Input id="client_name" {...register("client_name")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="project_url">URL do Projeto</Label>
          <Input id="project_url" {...register("project_url")} placeholder="https://..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="challenge">Desafio</Label>
        <Textarea id="challenge" {...register("challenge")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="solution">Solução</Label>
        <Textarea id="solution" {...register("solution")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="results">Resultados</Label>
        <Textarea id="results" {...register("results")} rows={3} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="technologies">Tecnologias (separadas por vírgula)</Label>
          <Input id="technologies" {...register("technologies")} placeholder="React, TypeScript, Node.js" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input id="tags" {...register("tags")} placeholder="Web, Mobile, Design" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cover-image">Imagem de Capa</Label>
        <div className="flex items-center gap-4">
          <Input
            id="cover-image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="flex-1"
          />
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Preview"
              className="h-20 w-20 rounded object-cover"
            />
          )}
        </div>
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
            Projeto em destaque
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="submit"
          disabled={saveMutation.isPending || uploading}
        >
          {(saveMutation.isPending || uploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {project ? "Atualizar" : "Criar"} Projeto
        </Button>
      </div>
    </form>
  );
}
