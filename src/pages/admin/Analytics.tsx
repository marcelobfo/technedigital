import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, MousePointer, TrendingUp, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  topPages: { page: string; count: number }[];
  visitsByDay: { date: string; visits: number }[];
  deviceTypes: { device: string; count: number }[];
  referrers: { referrer: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-3))'];

export default function Analytics() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [period, setPeriod] = useState('7');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalVisits: 0,
    uniqueVisitors: 0,
    topPages: [],
    visitsByDay: [],
    deviceTypes: [],
    referrers: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(period));

      const { data: visits, error } = await supabase
        .from('site_analytics')
        .select('*')
        .gte('created_at', daysAgo.toISOString());

      if (error) throw error;

      if (!visits) {
        setLoading(false);
        return;
      }

      // Total de visitas
      const totalVisits = visits.length;

      // Visitantes únicos
      const uniqueVisitors = new Set(visits.map(v => v.visitor_id)).size;

      // Páginas mais visitadas
      const pageCount: Record<string, number> = {};
      visits.forEach(v => {
        pageCount[v.page_path] = (pageCount[v.page_path] || 0) + 1;
      });
      const topPages = Object.entries(pageCount)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Visitas por dia
      const dayCount: Record<string, number> = {};
      visits.forEach(v => {
        const date = new Date(v.created_at).toLocaleDateString('pt-BR');
        dayCount[date] = (dayCount[date] || 0) + 1;
      });
      const visitsByDay = Object.entries(dayCount)
        .map(([date, visits]) => ({ date, visits }))
        .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime());

      // Tipos de dispositivo
      const deviceCount: Record<string, number> = {};
      visits.forEach(v => {
        const device = v.device_type || 'Desconhecido';
        deviceCount[device] = (deviceCount[device] || 0) + 1;
      });
      const deviceTypes = Object.entries(deviceCount)
        .map(([device, count]) => ({ device, count }));

      // Referrers
      const referrerCount: Record<string, number> = {};
      visits.forEach(v => {
        const referrer = v.referrer || 'Direto';
        referrerCount[referrer] = (referrerCount[referrer] || 0) + 1;
      });
      const referrers = Object.entries(referrerCount)
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        totalVisits,
        uniqueVisitors,
        topPages,
        visitsByDay,
        deviceTypes,
        referrers,
      });
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAnalytics = async () => {
    setClearing(true);
    try {
      const { error } = await supabase
        .from('site_analytics')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (error) throw error;

      toast({
        title: "Dados limpos com sucesso",
        description: "Todos os dados de analytics foram removidos.",
      });

      await fetchAnalytics();
    } catch (error) {
      console.error('Erro ao limpar analytics:', error);
      toast({
        title: "Erro ao limpar dados",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao limpar os dados.",
        variant: "destructive",
      });
    } finally {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics do Site</h1>
          <p className="text-muted-foreground">Visualize estatísticas de visitantes e páginas</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Dados
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação irá remover TODOS os dados de analytics permanentemente. 
                  Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAnalytics}
                  disabled={clearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearing ? "Limpando..." : "Limpar Todos os Dados"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Compact Metric Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Eye className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVisits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Visitas no período</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueVisitors.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Usuários distintos</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas Rastreadas</CardTitle>
            <MousePointer className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topPages.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Páginas acessadas</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Páginas</CardTitle>
            <TrendingUp className="h-4 w-4 text-chart-3" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.uniqueVisitors > 0 
                ? (analytics.totalVisits / analytics.uniqueVisitors).toFixed(1)
                : '0'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Páginas por visitante</p>
          </CardContent>
        </Card>
      </div>

      {/* Highlighted Line Chart - Full Width */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">📈 Visitas por Dia</CardTitle>
          <CardDescription>Evolução de visitas no período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={analytics.visitsByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="visits" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                name="Visitas"
                dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Side by Side Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">📊 Top 5 Páginas</CardTitle>
            <CardDescription>Páginas com mais acessos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.topPages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis 
                  dataKey="page" 
                  type="category" 
                  width={120}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Visitas" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🥧 Tipos de Dispositivo</CardTitle>
            <CardDescription>Distribuição por dispositivo</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.deviceTypes}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ device, percent }) => `${device} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {analytics.deviceTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Traffic Sources Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">📍 Top 5 Origens de Tráfego</CardTitle>
          <CardDescription>Principais fontes de visitantes</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">#</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead className="text-right">Visitas</TableHead>
                <TableHead className="text-right">Percentual</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analytics.referrers.length > 0 ? (
                analytics.referrers.map((ref, index) => (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-sm truncate max-w-md">{ref.referrer}</TableCell>
                    <TableCell className="text-right font-semibold">{ref.count.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {((ref.count / analytics.totalVisits) * 100).toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Nenhum dado de origem disponível
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}