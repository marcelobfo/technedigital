import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Mail, Server, Key, Send, Eye, EyeOff } from "lucide-react";

interface EmailSettingsData {
  id: string;
  provider: string;
  is_active: boolean;
  resend_api_key: string | null;
  resend_from_email: string | null;
  resend_from_name: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  smtp_password: string | null;
  smtp_from_email: string | null;
  smtp_from_name: string | null;
  smtp_secure: boolean | null;
}

export default function EmailSettings() {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("email_settings")
        .select("*")
        .maybeSingle();

      if (error) throw error;
      return data as EmailSettingsData | null;
    },
  });

  const [formData, setFormData] = useState<Partial<EmailSettingsData>>({});

  // Initialize form when data loads
  const currentSettings = {
    ...settings,
    ...formData,
  };

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<EmailSettingsData>) => {
      if (settings?.id) {
        const { error } = await supabase
          .from("email_settings")
          .update(data)
          .eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("email_settings").insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
      toast.success("Configurações salvas com sucesso!");
      setFormData({});
    },
    onError: (error) => {
      toast.error("Erro ao salvar configurações: " + error.message);
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("test-email-connection", {
        body: { settingsId: settings?.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Email de teste enviado com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar email de teste: " + error.message);
    },
  });

  const handleChange = (field: keyof EmailSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const provider = currentSettings.provider || "resend";

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações de Email</h1>
          <p className="text-muted-foreground">
            Configure o provedor de email para envio de notificações
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Provedor de Email
            </CardTitle>
            <CardDescription>
              Escolha entre Resend API ou servidor SMTP próprio
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Envio de emails ativo</Label>
              <Switch
                id="is_active"
                checked={currentSettings.is_active ?? true}
                onCheckedChange={(checked) => handleChange("is_active", checked)}
              />
            </div>

            <RadioGroup
              value={provider}
              onValueChange={(value) => handleChange("provider", value)}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="resend"
                  id="resend"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="resend"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Key className="mb-3 h-6 w-6" />
                  <span className="font-semibold">Resend API</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Serviço de email moderno e confiável
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="smtp"
                  id="smtp"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="smtp"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Server className="mb-3 h-6 w-6" />
                  <span className="font-semibold">SMTP</span>
                  <span className="text-xs text-muted-foreground text-center mt-1">
                    Servidor SMTP próprio ou terceiros
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {provider === "resend" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Configurações Resend
              </CardTitle>
              <CardDescription>
                Obtenha sua API key em{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com/api-keys
                </a>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resend_api_key">API Key</Label>
                <div className="relative">
                  <Input
                    id="resend_api_key"
                    type={showApiKey ? "text" : "password"}
                    value={currentSettings.resend_api_key || ""}
                    onChange={(e) => handleChange("resend_api_key", e.target.value)}
                    placeholder="re_xxxxxxxx..."
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resend_from_name">Nome do Remetente</Label>
                  <Input
                    id="resend_from_name"
                    value={currentSettings.resend_from_name || ""}
                    onChange={(e) => handleChange("resend_from_name", e.target.value)}
                    placeholder="Minha Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resend_from_email">Email do Remetente</Label>
                  <Input
                    id="resend_from_email"
                    type="email"
                    value={currentSettings.resend_from_email || ""}
                    onChange={(e) => handleChange("resend_from_email", e.target.value)}
                    placeholder="noreply@seudominio.com"
                  />
                </div>
              </div>

              <p className="text-sm text-muted-foreground">
                Nota: Para usar um domínio próprio, valide-o em{" "}
                <a
                  href="https://resend.com/domains"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  resend.com/domains
                </a>
              </p>
            </CardContent>
          </Card>
        )}

        {provider === "smtp" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Configurações SMTP
              </CardTitle>
              <CardDescription>
                Configure seu servidor SMTP para envio de emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_host">Host SMTP</Label>
                  <Input
                    id="smtp_host"
                    value={currentSettings.smtp_host || ""}
                    onChange={(e) => handleChange("smtp_host", e.target.value)}
                    placeholder="smtp.exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_port">Porta</Label>
                  <Input
                    id="smtp_port"
                    type="number"
                    value={currentSettings.smtp_port || 587}
                    onChange={(e) => handleChange("smtp_port", parseInt(e.target.value))}
                    placeholder="587"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_user">Usuário</Label>
                  <Input
                    id="smtp_user"
                    value={currentSettings.smtp_user || ""}
                    onChange={(e) => handleChange("smtp_user", e.target.value)}
                    placeholder="usuario@exemplo.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="smtp_password"
                      type={showSmtpPassword ? "text" : "password"}
                      value={currentSettings.smtp_password || ""}
                      onChange={(e) => handleChange("smtp_password", e.target.value)}
                      placeholder="••••••••"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSmtpPassword(!showSmtpPassword)}
                    >
                      {showSmtpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_name">Nome do Remetente</Label>
                  <Input
                    id="smtp_from_name"
                    value={currentSettings.smtp_from_name || ""}
                    onChange={(e) => handleChange("smtp_from_name", e.target.value)}
                    placeholder="Minha Empresa"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smtp_from_email">Email do Remetente</Label>
                  <Input
                    id="smtp_from_email"
                    type="email"
                    value={currentSettings.smtp_from_email || ""}
                    onChange={(e) => handleChange("smtp_from_email", e.target.value)}
                    placeholder="noreply@seudominio.com"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smtp_secure">Conexão Segura (TLS/SSL)</Label>
                  <p className="text-sm text-muted-foreground">
                    Recomendado para portas 465 ou 587
                  </p>
                </div>
                <Switch
                  id="smtp_secure"
                  checked={currentSettings.smtp_secure ?? true}
                  onCheckedChange={(checked) => handleChange("smtp_secure", checked)}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || Object.keys(formData).length === 0}
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Configurações
          </Button>
          <Button
            variant="outline"
            onClick={() => testEmailMutation.mutate()}
            disabled={testEmailMutation.isPending || !settings?.id}
          >
            {testEmailMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Testar Conexão
          </Button>
        </div>
      </div>
  );
}
