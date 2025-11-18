import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Filter, X, LayoutGrid, List } from "lucide-react";
import { LeadCard } from "@/components/admin/LeadCard";
import { LeadDetailsDrawer } from "@/components/admin/LeadDetailsDrawer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  read: boolean | null;
};

const COLUMNS = [
  { id: "new", title: "Novos", color: "bg-blue-500" },
  { id: "contacted", title: "Contactados", color: "bg-yellow-500" },
  { id: "qualified", title: "Qualificados", color: "bg-purple-500" },
  { id: "proposal_sent", title: "Proposta Enviada", color: "bg-orange-500" },
  { id: "won", title: "Ganhos", color: "bg-green-500" },
  { id: "lost", title: "Perdidos", color: "bg-red-500" },
];

export default function Leads() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const { toast } = useToast();

  useEffect(() => {
    fetchLeads();

    // Setup realtime subscription
    const channel = supabase
      .channel("leads-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const newLead = payload.new as Lead;
          setLeads((prev) => [newLead, ...prev]);
          
          toast({
            title: "Novo Lead! 🎉",
            description: `${newLead.name} acabou de entrar em contato.`,
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "leads",
        },
        (payload) => {
          const updatedLead = payload.new as Lead;
          setLeads((prev) =>
            prev.map((lead) => (lead.id === updatedLead.id ? updatedLead : lead))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLeads(data || []);
    } catch (error) {
      console.error("Error fetching leads:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os leads",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination || destination.droppableId === source.droppableId) {
      return;
    }

    const newStatus = destination.droppableId;
    const leadId = draggableId;

    // Optimistic update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus as any })
        .eq("id", leadId);

      if (error) throw error;

      // Log activity
      const user = await supabase.auth.getUser();
      await supabase.from("lead_activities").insert([{
        lead_id: leadId,
        user_id: user.data.user?.id || "",
        activity_type: "note",
        description: `Status alterado para ${COLUMNS.find((c) => c.id === newStatus)?.title}`,
      }]);

      toast({
        title: "Status atualizado",
        description: "Lead movido com sucesso",
      });
    } catch (error) {
      console.error("Error updating lead:", error);
      fetchLeads(); // Revert on error
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status",
        variant: "destructive",
      });
    }
  };

  const exportToCSV = () => {
    const filteredLeads = getFilteredLeads();
    const headers = ["Nome", "Email", "Telefone", "Status", "Prioridade", "Data"];
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone || "",
      lead.status,
      lead.priority,
      new Date(lead.created_at).toLocaleDateString(),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `leads_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const getFilteredLeads = () => {
    let filtered = leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((lead) => lead.priority === priorityFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter((lead) => {
        const leadDate = new Date(lead.created_at);
        const leadDay = new Date(
          leadDate.getFullYear(),
          leadDate.getMonth(),
          leadDate.getDate()
        );

        switch (dateFilter) {
          case "today":
            return leadDay.getTime() === today.getTime();
          case "7days":
            const sevenDaysAgo = new Date(today);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return leadDay >= sevenDaysAgo;
          case "30days":
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return leadDay >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }

    return filtered;
  };

  const clearFilters = () => {
    setPriorityFilter("all");
    setDateFilter("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    priorityFilter !== "all" || dateFilter !== "all" || searchQuery !== "";

  const getLeadsByStatus = (status: string) => {
    return getFilteredLeads().filter((lead) => lead.status === status);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold">Gestão de Leads</h1>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'kanban' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('kanban')}
          >
            <LayoutGrid className="mr-2 h-4 w-4" />
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="mr-2 h-4 w-4" />
            Lista
          </Button>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            size="sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {[
                  priorityFilter !== "all" ? 1 : 0,
                  dateFilter !== "all" ? 1 : 0,
                  searchQuery !== "" ? 1 : 0,
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Prioridade</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="7days">Últimos 7 dias</SelectItem>
                  <SelectItem value="30days">Últimos 30 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background"
                />
              </div>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex justify-end">
              <Button onClick={clearFilters} variant="ghost" size="sm">
                <X className="mr-2 h-4 w-4" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      )}

      {viewMode === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {COLUMNS.map((column) => (
              <div key={column.id} className="flex flex-col">
                <div className={`${column.color} text-white p-3 rounded-t-lg`}>
                  <h3 className="font-semibold text-sm">
                    {column.title} ({getLeadsByStatus(column.id).length})
                  </h3>
                </div>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 p-2 bg-muted/50 rounded-b-lg min-h-[500px] ${
                        snapshot.isDraggingOver ? "bg-muted" : ""
                      }`}
                    >
                      {getLeadsByStatus(column.id).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <LeadCard
                                lead={lead}
                                isDragging={snapshot.isDragging}
                                onClick={() => setSelectedLead(lead)}
                              />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {getFilteredLeads().map((lead) => (
                <TableRow 
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLead(lead)}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email}</TableCell>
                  <TableCell>{lead.phone || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {COLUMNS.find(c => c.id === lead.status)?.title || lead.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        lead.priority === 'high' ? 'destructive' : 
                        lead.priority === 'medium' ? 'default' : 
                        'secondary'
                      }
                    >
                      {lead.priority === 'high' ? 'Alta' : 
                       lead.priority === 'medium' ? 'Média' : 
                       'Baixa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <LeadDetailsDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onUpdate={fetchLeads}
      />
    </div>
  );
}
