import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { ProposalKanbanColumn } from "@/components/admin/ProposalKanbanColumn";
import { Card } from "@/components/ui/card";

type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";

interface Proposal {
  id: string;
  proposal_number: string;
  status: ProposalStatus;
  final_amount: number;
  created_at: string;
  valid_until: string | null;
  lead_id: string;
  leads: {
    name: string;
    email: string;
  };
}

const statusConfig: Record<
  ProposalStatus,
  { label: string; color: string }
> = {
  draft: { label: "Rascunho", color: "#94a3b8" },
  sent: { label: "Enviada", color: "#3b82f6" },
  accepted: { label: "Aceita", color: "#22c55e" },
  rejected: { label: "Rejeitada", color: "#ef4444" },
};

export default function Proposals() {
  const navigate = useNavigate();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      const { data, error } = await supabase
        .from("proposals")
        .select(`
          id,
          proposal_number,
          status,
          final_amount,
          created_at,
          valid_until,
          lead_id,
          leads (
            name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProposals(data || []);
    } catch (error) {
      console.error("Erro ao buscar propostas:", error);
      toast.error("Erro ao carregar propostas");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const newStatus = destination.droppableId as ProposalStatus;

    try {
      const { error } = await supabase
        .from("proposals")
        .update({ status: newStatus })
        .eq("id", draggableId);

      if (error) throw error;

      if (newStatus === "accepted") {
        toast.success("Proposta aceita! Registro financeiro criado automaticamente.", {
          description: "Acesse a página Financeiro para gerenciar o recebimento.",
        });
      } else if (newStatus === "rejected") {
        toast.info("Proposta marcada como rejeitada");
      } else {
        toast.success("Status da proposta atualizado!");
      }

      fetchProposals();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da proposta");
    }
  };

  const getProposalsByStatus = (status: ProposalStatus) => {
    return proposals.filter((p) => p.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Propostas Comerciais</h1>
          <p className="text-muted-foreground">
            Arraste os cards para atualizar o status das propostas
          </p>
        </div>
        <Button onClick={() => navigate("/admin/proposals/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Proposta
        </Button>
      </div>

      {proposals.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma proposta criada</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando sua primeira proposta comercial
          </p>
          <Button onClick={() => navigate("/admin/proposals/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Criar Proposta
          </Button>
        </Card>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(["draft", "sent", "accepted", "rejected"] as ProposalStatus[]).map(
              (status) => (
                <ProposalKanbanColumn
                  key={status}
                  status={status}
                  title={statusConfig[status].label}
                  color={statusConfig[status].color}
                  proposals={getProposalsByStatus(status)}
                />
              )
            )}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
