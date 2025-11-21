import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';
import { Loader2, Send } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const leadFormSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(100),
  personType: z.enum(['pessoa_fisica', 'empresa']),
  cpf: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().trim().min(10, 'Telefone é obrigatório').max(20),
  service: z.string().min(1, 'Selecione um serviço'),
  message: z.string().trim().min(10, 'Mensagem muito curta').max(2000),
}).refine(data => {
  if (data.personType === 'pessoa_fisica') {
    return data.cpf && data.cpf.replace(/\D/g, '').length === 11;
  }
  return true;
}, { message: 'CPF inválido', path: ['cpf'] })
.refine(data => {
  if (data.personType === 'empresa') {
    return data.cnpj && data.cnpj.replace(/\D/g, '').length === 14;
  }
  return true;
}, { message: 'CNPJ inválido', path: ['cnpj'] });

interface LeadFormDialogProps {
  trigger: React.ReactNode;
  defaultMessage?: string;
}

export function LeadFormDialog({ trigger, defaultMessage = '' }: LeadFormDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    personType: 'pessoa_fisica' as 'pessoa_fisica' | 'empresa',
    cpf: '',
    cnpj: '',
    phone: '',
    service: '',
    message: defaultMessage,
  });

  const { data: services, isLoading: loadingServices } = useQuery({
    queryKey: ['services-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, title, slug')
        .eq('status', 'active')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
      .substring(0, 14);
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
      .substring(0, 18);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .substring(0, 15);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const validatedData = leadFormSchema.parse(formData);

      const leadNotes = `Tipo: ${validatedData.personType === 'pessoa_fisica' ? 'Pessoa Física' : 'Empresa'}\n` +
        `${validatedData.personType === 'pessoa_fisica' ? `CPF: ${validatedData.cpf}` : `CNPJ: ${validatedData.cnpj}`}\n` +
        `Serviço de interesse: ${services?.find(s => s.id === validatedData.service)?.title || validatedData.service}`;

      const { data: lead, error } = await supabase
        .from('leads')
        .insert([{
          name: validatedData.name,
          phone: validatedData.phone.replace(/\D/g, ''),
          email: `lead-${Date.now()}@placeholder.com`, // Email placeholder para não violar constraint
          message: validatedData.message,
          notes: leadNotes,
          status: 'new',
          priority: 'medium',
          source: 'hero_form',
        }])
        .select()
        .single();

      if (error) throw error;

      // Enviar mensagem de boas-vindas via WhatsApp
      if (lead && validatedData.phone) {
        try {
          await supabase.functions.invoke('send-welcome-whatsapp', {
            body: {
              lead_id: lead.id,
              phone_number: validatedData.phone.replace(/\D/g, ''),
              lead_name: validatedData.name,
            },
          });
        } catch (whatsappError) {
          console.error('Erro ao enviar WhatsApp:', whatsappError);
          // Não bloqueia o fluxo se falhar
        }
      }

      toast({
        title: 'Solicitação enviada! 🎉',
        description: 'Recebemos seu contato e em breve um especialista entrará em contato via WhatsApp.',
      });

      setFormData({
        name: '',
        personType: 'pessoa_fisica',
        cpf: '',
        cnpj: '',
        phone: '',
        service: '',
        message: defaultMessage,
      });
      setOpen(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: 'Erro de validação',
          description: error.errors[0].message,
          variant: 'destructive',
        });
      } else {
        console.error('Error submitting lead form:', error);
        toast({
          title: 'Erro ao enviar',
          description: 'Ocorreu um erro. Tente novamente.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Solicitar Orçamento</DialogTitle>
          <DialogDescription>
            Preencha o formulário abaixo e nossa equipe entrará em contato em breve!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Digite seu nome completo"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          {/* Tipo de Pessoa */}
          <div className="space-y-3">
            <Label>Tipo de Pessoa *</Label>
            <RadioGroup
              value={formData.personType}
              onValueChange={(value: 'pessoa_fisica' | 'empresa') => 
                setFormData({ ...formData, personType: value, cpf: '', cnpj: '' })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pessoa_fisica" id="pessoa_fisica" />
                <Label htmlFor="pessoa_fisica" className="font-normal cursor-pointer">
                  Pessoa Física
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="empresa" id="empresa" />
                <Label htmlFor="empresa" className="font-normal cursor-pointer">
                  Empresa
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* CPF ou CNPJ */}
          {formData.personType === 'pessoa_fisica' ? (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                maxLength={14}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({ ...formData, cnpj: formatCNPJ(e.target.value) })}
                maxLength={18}
                required
              />
            </div>
          )}

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone">WhatsApp *</Label>
            <Input
              id="phone"
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
              maxLength={15}
              required
            />
          </div>

          {/* Serviço */}
          <div className="space-y-2">
            <Label htmlFor="service">Serviço de Interesse *</Label>
            <Select
              value={formData.service}
              onValueChange={(value) => setFormData({ ...formData, service: value })}
              required
            >
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {loadingServices ? (
                  <SelectItem value="loading" disabled>Carregando...</SelectItem>
                ) : services && services.length > 0 ? (
                  services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.title}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Nenhum serviço disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              placeholder="Conte-nos sobre seu projeto ou necessidade..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={4}
              required
            />
          </div>

          {/* Botão Submit */}
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={isSubmitting}
            style={{ background: 'var(--gradient-accent)' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Solicitação
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Ao enviar, você concorda em receber contato via WhatsApp
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
