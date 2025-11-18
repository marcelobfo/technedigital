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
import { Loader2, Star } from "lucide-react";

const formSchema = z.object({
  client_name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  client_role: z.string().min(2, "Cargo deve ter no mínimo 2 caracteres"),
  client_company: z.string().optional(),
  testimonial_text: z.string().min(20, "Depoimento deve ter no mínimo 20 caracteres"),
  rating: z.number().min(1).max(5),
  is_featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']),
  display_order: z.number().default(0),
});

type FormData = z.infer<typeof formSchema>;

interface TestimonialFormProps {
  testimonial?: any;
  onSuccess: () => void;
}

export default function TestimonialForm({ testimonial, onSuccess }: TestimonialFormProps) {
  const [clientPhoto, setClientPhoto] = useState<File | null>(null);
  const [clientPhotoUrl, setClientPhotoUrl] = useState(testimonial?.client_photo || "");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_name: testimonial?.client_name || "",
      client_role: testimonial?.client_role || "",
      client_company: testimonial?.client_company || "",
      testimonial_text: testimonial?.testimonial_text || "",
      rating: testimonial?.rating || 5,
      is_featured: testimonial?.is_featured || false,
      status: testimonial?.status || "active",
      display_order: testimonial?.display_order || 0,
    },
  });

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('testimonial-photos')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('testimonial-photos')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      let photoUrl = clientPhotoUrl;

      if (clientPhoto) {
        setUploading(true);
        photoUrl = await uploadImage(clientPhoto);
        setUploading(false);
      }

      const testimonialData = {
        client_name: data.client_name,
        client_role: data.client_role,
        client_company: data.client_company || null,
        client_photo: photoUrl || null,
        testimonial_text: data.testimonial_text,
        rating: data.rating,
        is_featured: data.is_featured,
        status: data.status,
        display_order: data.display_order,
      };

      if (testimonial?.id) {
        const { error } = await supabase
          .from('testimonials')
          .update(testimonialData)
          .eq('id', testimonial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('testimonials')
          .insert([testimonialData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['testimonials'] });
      toast({ title: "Depoimento salvo com sucesso!" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar depoimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setClientPhoto(e.target.files[0]);
      setClientPhotoUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const onSubmit = (data: FormData) => {
    saveMutation.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_name">Nome do Cliente *</Label>
          <Input id="client_name" {...register("client_name")} />
          {errors.client_name && (
            <p className="text-sm text-destructive">{errors.client_name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_role">Cargo *</Label>
          <Input id="client_role" {...register("client_role")} />
          {errors.client_role && (
            <p className="text-sm text-destructive">{errors.client_role.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client_company">Empresa</Label>
        <Input id="client_company" {...register("client_company")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="testimonial_text">Depoimento *</Label>
        <Textarea id="testimonial_text" {...register("testimonial_text")} rows={5} />
        {errors.testimonial_text && (
          <p className="text-sm text-destructive">{errors.testimonial_text.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Avaliação *</Label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setValue("rating", value)}
              className="transition-colors"
            >
              <Star
                className={`h-8 w-8 ${
                  value <= watch("rating")
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="client-photo">Foto do Cliente</Label>
        <div className="flex items-center gap-4">
          <Input
            id="client-photo"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="flex-1"
          />
          {clientPhotoUrl && (
            <img
              src={clientPhotoUrl}
              alt="Preview"
              className="h-16 w-16 rounded-full object-cover"
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
            Depoimento em destaque
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
          {testimonial ? "Atualizar" : "Criar"} Depoimento
        </Button>
      </div>
    </form>
  );
}
