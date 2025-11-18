import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Calendar, Mail, Phone } from "lucide-react";

type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  priority: string;
  created_at: string;
};

interface LeadCardProps {
  lead: Lead;
  isDragging: boolean;
  onClick: () => void;
}

const priorityColors = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function LeadCard({ lead, isDragging, onClick }: LeadCardProps) {
  return (
    <Card
      className={`p-3 mb-2 cursor-pointer hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50" : ""
      }`}
      onClick={onClick}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <h4 className="font-semibold text-sm line-clamp-1">{lead.name}</h4>
          <Badge
            className={priorityColors[lead.priority as keyof typeof priorityColors]}
            variant="secondary"
          >
            {lead.priority}
          </Badge>
        </div>
        
        <div className="space-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Mail className="h-3 w-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          
          {lead.phone && (
            <div className="flex items-center gap-1">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
