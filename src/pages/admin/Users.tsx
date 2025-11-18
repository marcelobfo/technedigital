import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, UserCog } from "lucide-react";

export default function Users() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, created_at');
      
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      return profiles.map(profile => ({
        ...profile,
        roles: roles.filter(r => r.user_id === profile.id).map(r => r.role),
      }));
    },
  });

  const toggleRoleMutation = useMutation({
    mutationFn: async ({ userId, role, action }: { userId: string; role: string; action: 'add' | 'remove' }) => {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: role as 'admin' | 'editor' | 'viewer' }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role as 'admin' | 'editor' | 'viewer');
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast({ title: "Role atualizado com sucesso!" });
    },
  });

  const roleColors: Record<string, string> = {
    admin: "bg-red-500",
    editor: "bg-blue-500",
    viewer: "bg-gray-500",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Usuários</h1>
        <p className="text-muted-foreground">Gerencie usuários e suas permissões</p>
      </div>

      {isLoading ? (
        <div className="rounded-lg border p-8 text-center">Carregando...</div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.full_name}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.roles.map((role: string) => (
                        <Badge key={role} className={roleColors[role]}>
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {!user.roles.includes('admin') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRoleMutation.mutate({ userId: user.id, role: 'admin', action: 'add' })}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Tornar Admin
                        </Button>
                      )}
                      {!user.roles.includes('editor') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleRoleMutation.mutate({ userId: user.id, role: 'editor', action: 'add' })}
                        >
                          <UserCog className="mr-2 h-4 w-4" />
                          Tornar Editor
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
