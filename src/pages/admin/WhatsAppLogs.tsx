import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RefreshCw, Search, Eye, Phone, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface WhatsAppLog {
  id: string;
  lead_id: string | null;
  phone_number: string;
  formatted_phone: string | null;
  message_type: string;
  status: string;
  api_response: any;
  error_message: string | null;
  created_at: string;
  leads?: {
    name: string;
    email: string;
  } | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30', icon: Clock },
  sent: { label: 'Enviado', color: 'bg-green-500/20 text-green-700 border-green-500/30', icon: CheckCircle },
  error: { label: 'Erro', color: 'bg-red-500/20 text-red-700 border-red-500/30', icon: XCircle },
  skipped: { label: 'Ignorado', color: 'bg-gray-500/20 text-gray-700 border-gray-500/30', icon: AlertTriangle },
};

export default function WhatsAppLogs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['whatsapp-logs', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('whatsapp_logs')
        .select(`
          *,
          leads (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as WhatsAppLog[];
    },
  });

  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.phone_number?.toLowerCase().includes(search) ||
      log.formatted_phone?.toLowerCase().includes(search) ||
      log.leads?.name?.toLowerCase().includes(search) ||
      log.leads?.email?.toLowerCase().includes(search) ||
      log.error_message?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: logs?.length || 0,
    sent: logs?.filter(l => l.status === 'sent').length || 0,
    error: logs?.filter(l => l.status === 'error').length || 0,
    pending: logs?.filter(l => l.status === 'pending').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Logs do WhatsApp</h1>
        <p className="text-muted-foreground">
          Histórico de mensagens enviadas via WhatsApp API
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" /> Enviados
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.sent}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-500" /> Erros
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{stats.error}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-yellow-500" /> Pendentes
            </CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por telefone, nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="sent">Enviados</SelectItem>
                  <SelectItem value="error">Erros</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="skipped">Ignorados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefetching ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredLogs && filteredLogs.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => {
                    const status = statusConfig[log.status] || statusConfig.pending;
                    const StatusIcon = status.icon;
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {format(new Date(log.created_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {log.leads ? (
                            <div>
                              <p className="font-medium text-sm">{log.leads.name}</p>
                              <p className="text-xs text-muted-foreground">{log.leads.email}</p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-mono">{log.formatted_phone || log.phone_number}</p>
                              {log.formatted_phone && log.formatted_phone !== log.phone_number && (
                                <p className="text-xs text-muted-foreground">Original: {log.phone_number}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {log.message_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${status.color} border`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Detalhes do Log</DialogTitle>
                              </DialogHeader>
                              <ScrollArea className="max-h-[60vh]">
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p className="text-sm text-muted-foreground">Data/Hora</p>
                                      <p className="font-medium">
                                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Status</p>
                                      <Badge className={`${status.color} border`}>
                                        <StatusIcon className="h-3 w-3 mr-1" />
                                        {status.label}
                                      </Badge>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Telefone Original</p>
                                      <p className="font-mono">{log.phone_number}</p>
                                    </div>
                                    <div>
                                      <p className="text-sm text-muted-foreground">Telefone Formatado</p>
                                      <p className="font-mono">{log.formatted_phone || '-'}</p>
                                    </div>
                                  </div>

                                  {log.leads && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Lead</p>
                                      <div className="p-3 bg-muted rounded-md">
                                        <p className="font-medium">{log.leads.name}</p>
                                        <p className="text-sm text-muted-foreground">{log.leads.email}</p>
                                      </div>
                                    </div>
                                  )}

                                  {log.error_message && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Mensagem de Erro</p>
                                      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
                                        <pre className="text-sm text-red-700 dark:text-red-400 whitespace-pre-wrap break-all">
                                          {log.error_message}
                                        </pre>
                                      </div>
                                    </div>
                                  )}

                                  {log.api_response && (
                                    <div>
                                      <p className="text-sm text-muted-foreground mb-1">Resposta da API</p>
                                      <div className="p-3 bg-muted rounded-md">
                                        <pre className="text-xs whitespace-pre-wrap break-all overflow-auto">
                                          {JSON.stringify(log.api_response, null, 2)}
                                        </pre>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </ScrollArea>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum log encontrado</p>
              <p className="text-sm">Os logs aparecerão aqui quando mensagens forem enviadas</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
