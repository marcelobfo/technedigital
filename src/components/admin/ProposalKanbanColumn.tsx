import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { ProposalKanbanCard } from "./ProposalKanbanCard";

type ProposalStatus = "draft" | "sent" | "accepted" | "rejected";

interface Proposal {
  id: string;
  proposal_number: string;
  status: ProposalStatus;
  final_amount: number;
  created_at: string;
  valid_until: string | null;
  leads: {
    name: string;
    email: string;
  };
}

interface ProposalKanbanColumnProps {
  status: ProposalStatus;
  title: string;
  proposals: Proposal[];
  color: string;
}

export function ProposalKanbanColumn({
  status,
  title,
  proposals,
  color,
}: ProposalKanbanColumnProps) {
  const totalValue = proposals.reduce(
    (sum, p) => sum + Number(p.final_amount),
    0
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            {title}
          </h3>
          <Badge variant="secondary">{proposals.length}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Total: {formatCurrency(totalValue)}
        </p>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-3 min-h-[200px] p-3 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/20"
            }`}
          >
            {proposals.map((proposal, index) => (
              <Draggable
                key={proposal.id}
                draggableId={proposal.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? "opacity-50" : ""}
                  >
                    <ProposalKanbanCard proposal={proposal} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}

            {proposals.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Nenhuma proposta
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
