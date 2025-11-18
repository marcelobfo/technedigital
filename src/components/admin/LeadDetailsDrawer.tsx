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
import { Calendar, Mail, Phone, MessageSquare, Clock, FileText, Plus } from "lucide-react";

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
        .select("id, proposal_number, status, final_amount, created_at")
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
                      className="p-3 border rounded-lg cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => {
                        navigate(`/admin/proposals/${proposal.id}`);
                        onClose();
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{proposal.proposal_number}</span>
                        <Badge variant={
                          proposal.status === "accepted" ? "outline" :
                          proposal.status === "rejected" ? "destructive" :
                          proposal.status === "sent" ? "default" : "secondary"
                        }>
                          {proposal.status === "draft" ? "Rascunho" :
                           proposal.status === "sent" ? "Enviada" :
                           proposal.status === "accepted" ? "Aceita" : "Rejeitada"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(proposal.final_amount)}
                        </span>
                        <span>{new Date(proposal.created_at).toLocaleDateString()}</span>
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
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-primary"></div>
                      <div className="flex-1 space-y-1">
                        <p className="text-muted-foreground">{activity.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
