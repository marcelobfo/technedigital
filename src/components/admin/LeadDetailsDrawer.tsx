import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Mail, Phone, MessageSquare, Clock, FileText, Plus, Eye, Send, CheckCircle, Circle, Building2, Trash2 } from "lucide-react";

const parseCNPJData = (notes: string | null) => {
  if (!notes) return null;
  
  const cnpjSection = notes.split('--- DADOS DA EMPRESA (CNPJ) ---')[1];
  if (!cnpjSection) return null;
  
  const lines = cnpjSection.trim().split('\n');
  const data: Record<string, string> = {};
  
  lines.forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      data[key.trim()] = valueParts.join(':').trim();
    }
  });
  
  return data;
};

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  priority: string;
  created_at: string;
  notes: string | null;
};

type Activity = {
  id: string;
  description: string;
  activity_type: string;
  created_at: string;
  user_id: string;
};

interface LeadDetailsDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function LeadDetailsDrawer({ lead, onClose, onUpdate }: LeadDetailsDrawerProps) {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [proposals, setProposals] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [priority, setPriority] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (lead) {
      setPriority(lead.priority);
      fetchActivities();
      fetchProposals();
    }
  }, [lead]);

  const fetchActivities = async () => {
    if (!lead) return;

    try {
      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchProposals = async () => {
    if (!lead) return;

    try {
      const { data, error } = await supabase
        .from("proposals")
        .select("id, proposal_number, status, final_amount, created_at, sent_at, sent_via")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error("Error fetching proposals:", error);
    }
  };

  const createProposal = () => {
    navigate("/admin/proposals/new", { state: { leadId: lead?.id } });
    onClose();
  };

  const handleDeleteLead = async () => {
    if (!lead) return;
    
    setLoading(true);
    try {
      // Delete activities first (foreign key)
      await supabase
        .from("lead_activities")
        .delete()
        .eq("lead_id", lead.id);
      
      // Delete lead
      const { error } = await supabase
        .from("leads")
        .delete()
        .eq("id", lead.id);
      
      if (error) throw error;
      
      toast({
        title: "Lead excluído",
        description: "O lead foi removido com sucesso",
      });
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o lead",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!lead || !newNote.trim()) return;

    setLoading(true);
    try {
      const user = await supabase.auth.getUser();
      
      const { error } = await supabase.from("lead_activities").insert([{
        lead_id: lead.id,
        user_id: user.data.user?.id || "",
        activity_type: "note",
        description: newNote,
      }]);

      if (error) throw error;

      setNewNote("");
      fetchActivities();
      toast({
        title: "Nota adicionada",
        description: "A nota foi salva com sucesso",
      });
    } catch (error) {
      console.error("Error adding note:", error);
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a nota",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePriority = async (newPriority: string) => {
    if (!lead) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ priority: newPriority as any })
        .eq("id", lead.id);

      if (error) throw error;

      setPriority(newPriority);
      onUpdate();
      
      const user = await supabase.auth.getUser();
      await supabase.from("lead_activities").insert([{
        lead_id: lead.id,
        user_id: user.data.user?.id || "",
        activity_type: "note",
        description: `Prioridade alterada para ${newPriority}`,
      }]);

      fetchActivities();
      toast({
        title: "Prioridade atualizada",
        description: "A prioridade foi alterada com sucesso",
      });
    } catch (error) {
      console.error("Error updating priority:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a prioridade",
        variant: "destructive",
      });
    }
  };

  if (!lead) return null;

  const priorityColors = {
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  return (
    <Sheet open={!!lead} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>{lead.name}</SheetTitle>
          <SheetDescription>Detalhes e histórico do lead</SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Contact Info */}
            <div className="space-y-3">
              <h3 className="font-semibold">Informações de Contato</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${lead.email}`} className="hover:underline">
                    {lead.email}
                  </a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${lead.phone}`} className="hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(lead.created_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* CNPJ Data Section */}
            {(() => {
              const cnpjData = parseCNPJData(lead.notes);
              if (!cnpjData) return null;
              
              return (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Dados da Empresa (CNPJ)
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                      {/* Informações Principais */}
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {cnpjData['Razão Social'] && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Razão Social:</span>
                            <p className="font-semibold">{cnpjData['Razão Social']}</p>
                          </div>
                        )}
                        {cnpjData['Nome Fantasia'] && cnpjData['Nome Fantasia'] !== 'N/A' && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground">Nome Fantasia:</span>
                            <p className="font-medium">{cnpjData['Nome Fantasia']}</p>
                          </div>
                        )}
                        {cnpjData['CNPJ Completo'] && (
                          <div>
                            <span className="text-muted-foreground">CNPJ:</span>
                            <p className="font-mono">{cnpjData['CNPJ Completo']}</p>
                          </div>
                        )}
                        {cnpjData['Situação Cadastral'] && (
                          <div>
                            <span className="text-muted-foreground">Situação:</span>
                            <Badge variant={cnpjData['Situação Cadastral'] === 'Ativa' ? 'default' : 'destructive'}>
                              {cnpjData['Situação Cadastral']}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* Dados Complementares */}
                      <div className="space-y-2 text-sm">
                        {cnpjData['Porte'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Porte:</span>
                            <span>{cnpjData['Porte']}</span>
                          </div>
                        )}
                        {cnpjData['Capital Social'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Capital Social:</span>
                            <span>R$ {cnpjData['Capital Social']}</span>
                          </div>
                        )}
                        {cnpjData['Data Início Atividade'] && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Início Atividade:</span>
                            <span>{cnpjData['Data Início Atividade']}</span>
                          </div>
                        )}
                      </div>
                      
                      <Separator />
                      
                      {/* Atividade Principal */}
                      {cnpjData['Atividade Principal'] && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">Atividade Principal:</span>
                          <p className="mt-1">{cnpjData['Atividade Principal']}</p>
                        </div>
                      )}
                      
                      <Separator />
                      
                      {/* Endereço */}
                      <div className="text-sm space-y-1">
                        <span className="text-muted-foreground font-medium">Endereço:</span>
                        {cnpjData['Endereço'] && <p>{cnpjData['Endereço']}</p>}
                        {cnpjData['Cidade'] && <p>{cnpjData['Cidade']}</p>}
                        {cnpjData['CEP'] && <p>CEP: {cnpjData['CEP']}</p>}
                      </div>
                      
                      {/* Sócios */}
                      {cnpjData['Sócios'] && (
                        <>
                          <Separator />
                          <div className="text-sm">
                            <span className="text-muted-foreground font-medium">Sócios:</span>
                            <div className="mt-2 space-y-1">
                              {cnpjData['Sócios'].split('\n').filter(Boolean).map((socio, idx) => (
                                <p key={idx} className="pl-2 border-l-2 border-muted">
                                  {socio.replace('- ', '')}
                                </p>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}

            <Separator />

            {/* Priority */}
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={priority} onValueChange={handleUpdatePriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Proposals Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Propostas Comerciais
                </h3>
                <Button size="sm" onClick={createProposal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Proposta
                </Button>
              </div>
              {proposals.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma proposta criada</p>
              ) : (
                <div className="space-y-2">
                  {proposals.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="p-3 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{proposal.proposal_number}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            proposal.status === "accepted" ? "outline" :
                            proposal.status === "rejected" ? "destructive" :
                            proposal.status === "sent" ? "default" : "secondary"
                          }>
                            {proposal.status === "draft" ? "Rascunho" :
                             proposal.status === "sent" ? "Enviada" :
                             proposal.status === "accepted" ? "Aceita" : "Rejeitada"}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              navigate(`/admin/proposals/edit/${proposal.id}`);
                              onClose();
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Valor:</span>
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(proposal.final_amount)}
                          </span>
                        </div>
                        {proposal.sent_at && (
                          <div className="text-xs text-muted-foreground">
                            Enviado em: {new Date(proposal.sent_at).toLocaleDateString('pt-BR')}
                            {proposal.sent_via && ` via ${proposal.sent_via}`}
                          </div>
                        )}
                        {!proposal.sent_at && (
                          <div className="text-xs text-muted-foreground">
                            Criado em: {new Date(proposal.created_at).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Message */}
            {lead.message && (
              <>
                <div className="space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Mensagem Inicial
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {lead.message}
                  </p>
                </div>
                <Separator />
              </>
            )}

            {/* Add Note */}
            <div className="space-y-2">
              <Label htmlFor="new-note">Adicionar Nota</Label>
              <Textarea
                id="new-note"
                placeholder="Digite sua nota aqui..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={loading || !newNote.trim()}>
                Adicionar Nota
              </Button>
            </div>

            <Separator />

            {/* Activity Timeline */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Histórico de Atividades
              </h3>
              {activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma atividade registrada</p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const getActivityIcon = () => {
                      switch (activity.activity_type) {
                        case 'note':
                          return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
                        case 'status_change':
                          return <CheckCircle className="h-4 w-4 text-muted-foreground" />;
                        case 'email_sent':
                          return <Mail className="h-4 w-4 text-muted-foreground" />;
                        case 'proposal_sent':
                          return <Send className="h-4 w-4 text-blue-500" />;
                        default:
                          return <Circle className="h-4 w-4 text-muted-foreground" />;
                      }
                    };

                    return (
                      <div key={activity.id} className="flex gap-3 text-sm">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActivityIcon()}
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-muted-foreground">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(activity.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                 </div>
               )}
             </div>

             {/* Delete Lead Section */}
             <Separator />
             <div className="space-y-2 pt-4">
               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" className="w-full">
                     <Trash2 className="h-4 w-4 mr-2" />
                     Excluir Lead
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent>
                   <AlertDialogHeader>
                     <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                     <AlertDialogDescription>
                       Esta ação não pode ser desfeita. Isso excluirá permanentemente o lead
                       "{lead.name}" e todas as suas atividades associadas.
                     </AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter>
                     <AlertDialogCancel>Cancelar</AlertDialogCancel>
                     <AlertDialogAction
                       onClick={handleDeleteLead}
                       className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                     >
                       Sim, excluir
                     </AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
             </div>
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 }
