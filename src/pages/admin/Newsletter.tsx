import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Search, UserX, Users, Loader2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Newsletter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [unsubscribeEmail, setUnsubscribeEmail] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('subscribed_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ 
          status: 'unsubscribed',
          unsubscribed_at: new Date().toISOString(),
        })
        .eq('email', email);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      toast({
        title: 'Inscrito removido',
        description: 'O inscrito foi removido da newsletter.',
      });
      setUnsubscribeEmail(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover inscrito',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const filteredSubscribers = subscribers?.filter(sub =>
    sub.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = subscribers?.filter(s => s.status === 'active').length || 0;
  const totalCount = subscribers?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Newsletter</h1>
        <p className="text-muted-foreground">
          Gerencie inscritos e envie newsletters
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Inscritos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelados</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCount - activeCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Inscritos</CardTitle>
          <CardDescription>
            Visualize e gerencie todos os inscritos da newsletter
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredSubscribers && filteredSubscribers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data de Inscrição</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.map((subscriber) => (
                    <TableRow key={subscriber.id}>
                      <TableCell className="font-medium">{subscriber.email}</TableCell>
                      <TableCell>
                        <Badge variant={subscriber.status === 'active' ? 'default' : 'secondary'}>
                          {subscriber.status === 'active' ? 'Ativo' : 'Cancelado'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(subscriber.subscribed_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        {subscriber.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUnsubscribeEmail(subscriber.email)}
                          >
                            <UserX className="w-4 h-4 mr-2" />
                            Remover
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum inscrito encontrado
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!unsubscribeEmail} onOpenChange={() => setUnsubscribeEmail(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover inscrito?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {unsubscribeEmail} da newsletter? Esta ação pode ser revertida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unsubscribeEmail && unsubscribeMutation.mutate(unsubscribeEmail)}
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
