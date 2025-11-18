import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar, DollarSign, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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

const statusConfig: Record<ProposalStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Rascunho", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  accepted: { label: "Aceita", variant: "outline" },
  rejected: { label: "Rejeitada", variant: "destructive" },
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
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
            Gerencie suas propostas e acompanhe o status
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {proposals.map((proposal) => (
            <Card
              key={proposal.id}
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate(`/admin/proposals/${proposal.id}`)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      {proposal.proposal_number}
                    </p>
                    <h3 className="font-semibold text-lg mt-1">
                      {proposal.leads.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {proposal.leads.email}
                    </p>
                  </div>
                  <Badge variant={statusConfig[proposal.status].variant}>
                    {statusConfig[proposal.status].label}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="font-semibold">
                      {formatCurrency(proposal.final_amount)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Criada em{" "}
                      {format(new Date(proposal.created_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  {proposal.valid_until && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>
                        Válida até{" "}
                        {format(new Date(proposal.valid_until), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
