import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Filter,
  Download,
  Plus,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

type FinancialStatus = "pending" | "paid" | "canceled";
type FinancialType = "income" | "expense";

interface FinancialRecord {
  id: string;
  type: FinancialType;
  amount: number;
  date: string;
  status: FinancialStatus;
  category: string | null;
  notes: string | null;
  payment_method: string | null;
  lead_id: string | null;
  proposal_id: string | null;
  leads?: {
    name: string;
  };
  proposals?: {
    proposal_number: string;
  };
}

interface Stats {
  totalToReceive: number;
  totalReceived: number;
  totalOverdue: number;
  acceptedProposals: number;
}

export default function Financial() {
  const [records, setRecords] = useState<FinancialRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<FinancialRecord[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalToReceive: 0,
    totalReceived: 0,
    totalOverdue: 0,
    acceptedProposals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [records, filterType, filterStatus]);

  const fetchData = async () => {
    try {
      // Buscar registros financeiros
      const { data: financialData, error: financialError } = await supabase
        .from("financial_records")
        .select(`
          *,
          leads (name),
          proposals (proposal_number)
        `)
        .order("date", { ascending: false });

      if (financialError) throw financialError;

      // Calcular estatísticas
      const totalToReceive = financialData
        ?.filter((r) => r.type === "income" && r.status === "pending")
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const totalReceived = financialData
        ?.filter((r) => r.type === "income" && r.status === "paid")
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      // Calcular atrasados (pendentes com data passada)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const totalOverdue = financialData
        ?.filter((r) => {
          if (r.type !== "income" || r.status !== "pending") return false;
          const recordDate = new Date(r.date);
          recordDate.setHours(0, 0, 0, 0);
          return recordDate < today;
        })
        .reduce((sum, r) => sum + Number(r.amount), 0) || 0;

      const { count: proposalsCount } = await supabase
        .from("proposals")
        .select("*", { count: "exact", head: true })
        .eq("status", "accepted");

      setRecords(financialData || []);
      setStats({
        totalToReceive,
        totalReceived,
        totalOverdue,
        acceptedProposals: proposalsCount || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar dados financeiros:", error);
      toast.error("Erro ao carregar dados financeiros");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...records];

    if (filterType !== "all") {
      filtered = filtered.filter((r) => r.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((r) => r.status === filterStatus);
    }

    setFilteredRecords(filtered);
  };

  const updateRecordStatus = async (id: string, newStatus: FinancialStatus) => {
    try {
      const { error } = await supabase
        .from("financial_records")
        .update({ status: newStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success("Status atualizado com sucesso!");
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: FinancialStatus, date: string) => {
    // Check if pending and overdue
    if (status === "pending") {
      const recordDate = new Date(date);
      const today = new Date();
      recordDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      
      if (recordDate < today) {
        return { label: "Atrasado", variant: "destructive" as const };
      }
    }
    
    const config = {
      pending: { label: "Pendente", variant: "secondary" as const },
      paid: { label: "Pago", variant: "outline" as const },
      canceled: { label: "Cancelado", variant: "destructive" as const },
    };
    return config[status];
  };

  const getTypeBadge = (type: FinancialType) => {
    const config = {
      income: { label: "Receita", variant: "default" as const },
      expense: { label: "Despesa", variant: "secondary" as const },
    };
    return config[type];
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
          <h1 className="text-3xl font-bold">Gestão Financeira</h1>
          <p className="text-muted-foreground">
            Acompanhe receitas, despesas e propostas aceitas
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nova Despesa
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total a Receber</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalToReceive)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Recebido</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalReceived)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Em Atraso</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalOverdue)}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Propostas Aceitas</p>
              <p className="text-2xl font-bold">{stats.acceptedProposals}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="canceled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="ml-auto">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </Card>

      {/* Tabela de Registros */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRecords.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  Nenhum registro encontrado
                </TableCell>
              </TableRow>
            ) : (
              filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell>
                    {format(new Date(record.date), "dd/MM/yyyy", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadge(record.type).variant}>
                      {getTypeBadge(record.type).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      {record.proposals && (
                        <p className="font-medium">{record.proposals.proposal_number}</p>
                      )}
                      {record.leads && (
                        <p className="text-sm text-muted-foreground">{record.leads.name}</p>
                      )}
                      {record.notes && (
                        <p className="text-sm text-muted-foreground">{record.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(Number(record.amount))}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadge(record.status, record.date).variant}>
                      {getStatusBadge(record.status, record.date).label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {record.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => updateRecordStatus(record.id, "paid")}
                      >
                        Marcar como Pago
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
