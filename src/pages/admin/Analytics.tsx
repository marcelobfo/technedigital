import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Users, Eye, MousePointer, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  topPages: { page: string; count: number }[];
  visitsByDay: { date: string; visits: number }[];
  deviceTypes: { device: string; count: number }[];
  referrers: { referrer: string; count: number }[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
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
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics do Site</h1>
          <p className="text-muted-foreground">Visualize estatísticas de visitantes e páginas</p>
        </div>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Visitas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitantes Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.uniqueVisitors}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Páginas Rastreadas</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.topPages.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics.uniqueVisitors > 0 
                ? ((analytics.totalVisits / analytics.uniqueVisitors) * 100).toFixed(1) 
                : 0}%
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Visitas por Dia</CardTitle>
            <CardDescription>Evolução de visitas no período selecionado</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.visitsByDay}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visits" stroke="hsl(var(--primary))" name="Visitas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Páginas Mais Visitadas</CardTitle>
            <CardDescription>Top 5 páginas com mais acessos</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="page" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dispositivos</CardTitle>
            <CardDescription>Distribuição por tipo de dispositivo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.deviceTypes}
                  dataKey="count"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analytics.deviceTypes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Origem do Tráfego</CardTitle>
            <CardDescription>Top 5 fontes de tráfego</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.referrers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="referrer" type="category" width={150} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="hsl(var(--secondary))" name="Visitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
