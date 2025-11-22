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
import { useToast } from "@/hooks/use-toast";
import { Upload, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  title: z.string().min(5, "Título deve ter no mínimo 5 caracteres"),
  slug: z.string().min(3, "Slug deve ter no mínimo 3 caracteres"),
  content: z.string().min(50, "Conteúdo deve ter no mínimo 50 caracteres"),
  excerpt: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  tags: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
});

type FormData = z.infer<typeof formSchema>;

interface BlogPostFormProps {
  post?: any;
  onSuccess: () => void;
}

export default function BlogPostForm({ post, onSuccess }: BlogPostFormProps) {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState(post?.cover_image || "");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      content: post?.content || "",
      excerpt: post?.excerpt || "",
      category: post?.category || "",
      tags: post?.tags?.join(", ") || "",
      status: post?.status || "draft",
    },
  });

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError, data } = await supabase.storage
      .from('blog-images')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('blog-images')
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

      const postData = {
        title: data.title,
        slug: data.slug,
        content: data.content,
        excerpt: data.excerpt || "",
        category: data.category,
        status: data.status,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
        cover_image: imageUrl,
        author_id: user?.id!,
      };

      let postId = post?.id;

      if (post?.id) {
        const { error } = await supabase
          .from('blog_posts')
          .update(postData)
          .eq('id', post.id);
        if (error) throw error;
      } else {
        const { data: newPost, error } = await supabase
          .from('blog_posts')
          .insert([postData])
          .select()
          .single();
        if (error) throw error;
        postId = newPost.id;
      }

      return { postData, postId };
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
      toast({ title: "Post salvo com sucesso!" });

      // Auto-submit para Google Search Console se publicado
      if (result.postData.status === 'published') {
        try {
          const { data: gscSettings } = await supabase
            .from('google_search_console_settings')
            .select('auto_submit_on_publish, is_active')
            .single();

          if (gscSettings?.is_active && gscSettings?.auto_submit_on_publish) {
            await supabase.functions.invoke('auto-submit-new-content', {
              body: {
                url: `https://technedigital.com.br/blog/${result.postData.slug}`,
                type: 'blog_post',
                reference_id: result.postId
              }
            });
            console.log('Post submetido ao Google Search Console');
          }
        } catch (error) {
          console.error('Erro ao submeter ao Google:', error);
          // Não bloqueia o sucesso do post
        }
      }

      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar post",
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
      <div className="space-y-2">
        <Label htmlFor="title">Título *</Label>
        <Input
          id="title"
          {...register("title")}
          onBlur={(e) => {
            if (!post) {
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

      <div className="space-y-2">
        <Label htmlFor="excerpt">Resumo</Label>
        <Textarea id="excerpt" {...register("excerpt")} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Conteúdo *</Label>
        <Textarea id="content" {...register("content")} rows={10} />
        {errors.content && (
          <p className="text-sm text-destructive">{errors.content.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria *</Label>
          <Input id="category" {...register("category")} />
          {errors.category && (
            <p className="text-sm text-destructive">{errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select
            value={watch("status")}
            onValueChange={(value: any) => setValue("status", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="published">Publicado</SelectItem>
              <SelectItem value="archived">Arquivado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
        <Input id="tags" {...register("tags")} placeholder="React, TypeScript, Web Development" />
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

      <div className="flex gap-2 justify-end">
        <Button
          type="submit"
          disabled={saveMutation.isPending || uploading}
        >
          {(saveMutation.isPending || uploading) && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {post ? "Atualizar" : "Criar"} Post
        </Button>
      </div>
    </form>
  );
}
