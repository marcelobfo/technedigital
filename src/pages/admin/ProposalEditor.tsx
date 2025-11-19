import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Save, Send, Check, X, Plus, Trash2, GripVertical, Mail, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface Lead {
  id: string;
  name: string;
  email: string;
}

interface ProposalItem {
  id: string;
  service_name: string;
  description: string;
  unit_price: number;
  quantity: number;
  subtotal: number;
  display_order: number;
}

interface Proposal {
  id?: string;
  lead_id: string;
  status: "draft" | "sent" | "accepted" | "rejected";
  notes: string;
  terms_and_conditions: string;
  valid_until: string;
  discount_percentage: number;
  discount_amount: number;
  total_amount: number;
  final_amount: number;
}

export default function ProposalEditor() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [proposal, setProposal] = useState<Proposal>({
    lead_id: "",
    status: "draft",
    notes: "",
    terms_and_conditions: "",
    valid_until: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    discount_percentage: 0,
    discount_amount: 0,
    total_amount: 0,
    final_amount: 0,
  });
  const [items, setItems] = useState<ProposalItem[]>([]);

  useEffect(() => {
    fetchLeads();
    if (isEditing) {
      fetchProposal();
    }
  }, [id]);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from("leads")
      .select("id, name, email")
      .order("name");
    if (data) setLeads(data);
  };

  const fetchProposal = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const { data: proposalData, error: proposalError } = await supabase
        .from("proposals")
        .select("*")
        .eq("id", id)
        .single();

      if (proposalError) throw proposalError;

      const { data: itemsData, error: itemsError } = await supabase
        .from("proposal_items")
        .select("*")
        .eq("proposal_id", id)
        .order("display_order");

      if (itemsError) throw itemsError;

      setProposal({
        ...proposalData,
        valid_until: proposalData.valid_until || format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      });
      setItems(itemsData || []);
    } catch (error) {
      console.error("Erro ao carregar proposta:", error);
      toast.error("Erro ao carregar proposta");
    } finally {
      setLoading(false);
    }
  };

  const addItem = () => {
    const newItem: ProposalItem = {
      id: `temp-${Date.now()}`,
      service_name: "",
      description: "",
      unit_price: 0,
      quantity: 1,
      subtotal: 0,
      display_order: items.length,
    };
    setItems([...items, newItem]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ProposalItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === "unit_price" || field === "quantity") {
      newItems[index].subtotal = newItems[index].unit_price * newItems[index].quantity;
    }
    
    setItems(newItems);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [removed] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, removed);

    const itemsWithOrder = reorderedItems.map((item, index) => ({
      ...item,
      display_order: index,
    }));

    setItems(itemsWithOrder);
  };

  const handleSave = async (newStatus?: "draft" | "sent" | "accepted" | "rejected") => {
    if (!proposal.lead_id) {
      toast.error("Selecione um lead");
      return;
    }

    if (items.length === 0) {
      toast.error("Adicione pelo menos um item");
      return;
    }

    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const proposalData = {
        ...proposal,
        status: newStatus || proposal.status,
        created_by: user.user.id,
        proposal_number: "",
      };

      let proposalId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("proposals")
          .update(proposalData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("proposals")
          .insert(proposalData)
          .select()
          .single();
        if (error) throw error;
        proposalId = data.id;
      }

      // Delete existing items if editing
      if (isEditing) {
        await supabase.from("proposal_items").delete().eq("proposal_id", id);
      }

      // Insert items
      const itemsToInsert = items.map((item) => ({
        proposal_id: proposalId,
        service_name: item.service_name,
        description: item.description,
        unit_price: item.unit_price,
        quantity: item.quantity,
        display_order: item.display_order,
      }));

      const { error: itemsError } = await supabase
        .from("proposal_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update lead status if sent
      if (newStatus === "sent") {
        await supabase
          .from("leads")
          .update({ status: "proposal_sent" })
          .eq("id", proposal.lead_id);

        await supabase.from("lead_activities").insert({
          lead_id: proposal.lead_id,
          user_id: user.user.id,
          activity_type: "status_change",
          description: "Proposta comercial enviada",
        });
      }

      toast.success(isEditing ? "Proposta atualizada" : "Proposta criada");
      navigate("/admin/proposals");
    } catch (error) {
      console.error("Erro ao salvar proposta:", error);
      toast.error("Erro ao salvar proposta");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!proposal.id) {
      toast.error("Salve a proposta antes de enviar por email");
      return;
    }

    if (!proposal.lead_id) {
      toast.error("Selecione um lead antes de enviar");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-proposal-email', {
        body: { proposal_id: proposal.id },
      });

      if (error) throw error;

      toast.success("Proposta enviada por email com sucesso!");
      fetchProposal();
    } catch (error) {
      console.error("Erro ao enviar proposta por email:", error);
      toast.error("Erro ao enviar proposta por email");
    } finally {
      setSending(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!proposal.id) {
      toast.error("Salve a proposta antes de enviar pelo WhatsApp");
      return;
    }

    if (!proposal.lead_id) {
      toast.error("Selecione um lead antes de enviar");
      return;
    }

    // Buscar telefone do lead
    const lead = leads.find(l => l.id === proposal.lead_id);
    if (!lead) {
      toast.error("Lead não encontrado");
      return;
    }

    // Buscar dados completos do lead com telefone
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .select('phone')
      .eq('id', proposal.lead_id)
      .single();

    if (leadError || !leadData?.phone) {
      toast.error("Lead não possui telefone cadastrado");
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-whatsapp-proposal', {
        body: { 
          proposal_id: proposal.id,
          phone_number: leadData.phone,
        },
      });

      if (error) throw error;

      toast.success("Proposta enviada pelo WhatsApp com sucesso!");
      fetchProposal();
    } catch (error) {
      console.error("Erro ao enviar proposta pelo WhatsApp:", error);
      toast.error("Erro ao enviar proposta pelo WhatsApp");
    } finally {
      setSending(false);
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);
  const discountValue = proposal.discount_percentage > 0
    ? totalAmount * (proposal.discount_percentage / 100)
    : proposal.discount_amount;
  const finalAmount = totalAmount - discountValue;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin/proposals")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isEditing ? "Editar Proposta" : "Nova Proposta"}
            </h1>
            <p className="text-muted-foreground">
              Crie e gerencie propostas comerciais
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleSave("draft")} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Rascunho
          </Button>
          <Button onClick={() => handleSave("sent")} disabled={loading}>
            <Send className="mr-2 h-4 w-4" />
            Enviar Proposta
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="lead">Lead *</Label>
            <Select
              value={proposal.lead_id}
              onValueChange={(value) => setProposal({ ...proposal, lead_id: value })}
            >
              <SelectTrigger id="lead">
                <SelectValue placeholder="Selecione um lead" />
              </SelectTrigger>
              <SelectContent>
                {leads.map((lead) => (
                  <SelectItem key={lead.id} value={lead.id}>
                    {lead.name} - {lead.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="valid_until">Válido Até</Label>
            <Input
              id="valid_until"
              type="date"
              value={proposal.valid_until}
              onChange={(e) => setProposal({ ...proposal, valid_until: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Itens da Proposta</h3>
            <Button onClick={addItem} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Item
            </Button>
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="p-4"
                        >
                          <div className="flex gap-4">
                            <div {...provided.dragHandleProps} className="flex items-center">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-4">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                  <Label>Nome do Serviço *</Label>
                                  <Input
                                    value={item.service_name}
                                    onChange={(e) => updateItem(index, "service_name", e.target.value)}
                                    placeholder="Ex: Website Institucional"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="space-y-2">
                                    <Label>Valor Unit.</Label>
                                    <Input
                                      type="number"
                                      value={item.unit_price}
                                      onChange={(e) => updateItem(index, "unit_price", parseFloat(e.target.value) || 0)}
                                      placeholder="0.00"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Qtd.</Label>
                                    <Input
                                      type="number"
                                      value={item.quantity}
                                      onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 1)}
                                      min="1"
                                    />
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Textarea
                                  value={item.description}
                                  onChange={(e) => updateItem(index, "description", e.target.value)}
                                  placeholder="Descrição detalhada do serviço"
                                  rows={2}
                                />
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold">
                                  Subtotal: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.subtotal)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <Card className="p-4 bg-muted/50">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalAmount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Desconto:</span>
              <div className="flex gap-2">
                <Input
                  type="number"
                  className="w-20 h-8"
                  value={proposal.discount_percentage}
                  onChange={(e) => setProposal({ ...proposal, discount_percentage: parseFloat(e.target.value) || 0, discount_amount: 0 })}
                  placeholder="%"
                />
                <span className="text-muted-foreground">ou</span>
                <Input
                  type="number"
                  className="w-24 h-8"
                  value={proposal.discount_amount}
                  onChange={(e) => setProposal({ ...proposal, discount_amount: parseFloat(e.target.value) || 0, discount_percentage: 0 })}
                  placeholder="R$"
                />
              </div>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total:</span>
              <span>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(finalAmount)}</span>
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="notes">Observações Internas</Label>
            <Textarea
              id="notes"
              value={proposal.notes}
              onChange={(e) => setProposal({ ...proposal, notes: e.target.value })}
              placeholder="Anotações que não aparecerão na proposta enviada ao cliente"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="terms">Termos e Condições</Label>
            <Textarea
              id="terms"
              value={proposal.terms_and_conditions}
              onChange={(e) => setProposal({ ...proposal, terms_and_conditions: e.target.value })}
              placeholder="Condições de pagamento, prazos, garantias, etc."
              rows={4}
            />
          </div>
        </div>
      </Card>

      <div className="flex gap-3 justify-between">
        <Button variant="outline" onClick={() => navigate("/admin/proposals")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <div className="flex gap-3">
          {isEditing && proposal.id && (
            <>
              <Button
                variant="outline"
                onClick={handleSendEmail}
                disabled={sending || loading}
              >
                <Mail className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar por Email"}
              </Button>
              <Button
                variant="outline"
                onClick={handleSendWhatsApp}
                disabled={sending || loading}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                {sending ? "Enviando..." : "Enviar pelo WhatsApp"}
              </Button>
            </>
          )}
          <Button onClick={() => handleSave()} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Salvando..." : "Salvar Proposta"}
          </Button>
        </div>
      </div>
    </div>
  );
}
