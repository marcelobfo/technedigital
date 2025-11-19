import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Calendar, Eye } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ProposalKanbanCardProps {
  proposal: {
    id: string;
    proposal_number: string;
    final_amount: number;
    created_at: string;
    valid_until: string | null;
    leads: {
      name: string;
      email: string;
    };
  };
}

export function ProposalKanbanCard({ proposal }: ProposalKanbanCardProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <Card className="p-4 bg-card hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-xs text-muted-foreground mb-1">
              {proposal.proposal_number}
            </p>
            <h4 className="font-semibold text-sm">{proposal.leads.name}</h4>
            <p className="text-xs text-muted-foreground truncate">
              {proposal.leads.email}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/proposals/${proposal.id}`);
            }}
            className="p-1 hover:bg-accent rounded"
          >
            <Eye className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center text-sm">
            <DollarSign className="h-4 w-4 mr-1 text-primary" />
            <span className="font-semibold text-primary">
              {formatCurrency(proposal.final_amount)}
            </span>
          </div>

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {format(new Date(proposal.created_at), "dd/MM/yyyy", {
                locale: ptBR,
              })}
            </span>
          </div>

          {proposal.valid_until && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="h-3 w-3 mr-1" />
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
  );
}
