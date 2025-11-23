import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AddUrlDialog() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [pageType, setPageType] = useState<string>("page");
  const queryClient = useQueryClient();

  const addUrlMutation = useMutation({
    mutationFn: async () => {
      // Validar URL
      try {
        new URL(url);
      } catch {
        throw new Error("URL inválida");
      }

      if (!url.includes("technedigital.com.br")) {
        throw new Error("A URL deve ser do domínio technedigital.com.br");
      }

      // Salvar URL na tabela
      const { error: insertError } = await supabase
        .from("seo_indexing_status")
        .upsert({
          url: url,
          page_type: pageType,
          reference_id: null,
          indexing_status: "PENDING",
          last_checked: new Date().toISOString(),
        }, {
          onConflict: 'url'
        });

      if (insertError) throw insertError;

      // Chamar edge function para verificar status imediatamente
      const { error: functionError } = await supabase.functions.invoke(
        "fetch-indexing-status"
      );

      if (functionError) {
        console.error("Erro ao verificar status:", functionError);
        // Não lançar erro aqui, apenas avisar
        toast.warning("URL adicionada, mas não foi possível verificar status imediatamente");
      }
    },
    onSuccess: () => {
      toast.success("URL adicionada e verificação iniciada!");
      queryClient.invalidateQueries({ queryKey: ["seo-indexing-status"] });
      setOpen(false);
      setUrl("");
      setPageType("page");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao adicionar URL");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar URL Manual
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Adicionar URL para Monitoramento</DialogTitle>
          <DialogDescription>
            Adicione uma URL customizada para verificar seu status de indexação no Google
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">URL Completa</Label>
            <Input
              id="url"
              placeholder="https://technedigital.com.br/sua-pagina"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deve ser uma URL do domínio technedigital.com.br
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="type">Tipo de Página</Label>
            <Select value={pageType} onValueChange={setPageType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="page">Página</SelectItem>
                <SelectItem value="blog_post">Post do Blog</SelectItem>
                <SelectItem value="portfolio">Projeto Portfolio</SelectItem>
                <SelectItem value="service">Serviço</SelectItem>
                <SelectItem value="custom">Customizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={() => addUrlMutation.mutate()}
            disabled={addUrlMutation.isPending || !url}
          >
            {addUrlMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar e Verificar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
