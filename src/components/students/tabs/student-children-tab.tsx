import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentChildrenSchema, childSchema, type StudentChildrenForm, type ChildForm } from '@/lib/student-schemas';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Edit, Trash2, Users } from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Child {
  id: string;
  nome_completo: string;
  data_nascimento: string;
}

interface StudentChildrenTabProps {
  studentId?: string;
}

export function StudentChildrenTab({ studentId }: StudentChildrenTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [childrenRecordId, setChildrenRecordId] = useState<string | null>(null);
  const [childDialogOpen, setChildDialogOpen] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);

  const form = useForm<StudentChildrenForm>({
    resolver: zodResolver(studentChildrenSchema),
    defaultValues: {
      tem_filhos: false,
      quantidade_filhos: 0,
      convive_filhos: false,
    },
  });

  const childForm = useForm<ChildForm>({
    resolver: zodResolver(childSchema),
  });

  const temFilhos = form.watch('tem_filhos');

  useEffect(() => {
    if (studentId) {
      fetchChildrenData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchChildrenData = async () => {
    try {
      const { data: childrenData, error: childrenError } = await supabase
        .from('student_children')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (childrenError) throw childrenError;

      if (childrenData) {
        form.reset(childrenData);
        setChildrenRecordId(childrenData.id);

        // Fetch children list
        const { data: childrenList, error: listError } = await supabase
          .from('student_children_list')
          .select('*')
          .eq('student_children_id', childrenData.id)
          .order('data_nascimento', { ascending: false });

        if (listError) throw listError;
        setChildren(childrenList || []);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados dos filhos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentChildrenForm) => {
    if (!studentId) {
      toast({
        title: 'Erro',
        description: 'Salve o aluno primeiro para adicionar dados dos filhos',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { data: result, error } = await supabase
        .from('student_children')
        .upsert({ 
          ...data, 
          student_id: studentId,
          quantidade_filhos: children.length
        })
        .select()
        .single();

      if (error) throw error;

      setChildrenRecordId(result.id);

      toast({
        title: 'Sucesso',
        description: 'Dados dos filhos salvos com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados dos filhos',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const onChildSubmit = async (data: ChildForm) => {
    if (!childrenRecordId) {
      toast({
        title: 'Erro',
        description: 'Salve os dados dos filhos primeiro',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingChild) {
        const { error } = await supabase
          .from('student_children_list')
          .update(data)
          .eq('id', editingChild.id);

        if (error) throw error;
      } else {
        // Validate required fields before insertion
        if (!data.nome_completo || !data.data_nascimento) {
          toast({
            title: 'Erro',
            description: 'Nome completo e data de nascimento são obrigatórios.',
            variant: 'destructive',
          });
          return;
        }

        const { error } = await supabase
          .from('student_children_list')
          .insert({ 
            nome_completo: data.nome_completo,
            data_nascimento: data.data_nascimento,
            student_children_id: childrenRecordId 
          });

        if (error) throw error;
      }

      await fetchChildrenData();
      setChildDialogOpen(false);
      setEditingChild(null);
      childForm.reset();

      toast({
        title: 'Sucesso',
        description: editingChild ? 'Filho atualizado com sucesso!' : 'Filho adicionado com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados do filho',
        variant: 'destructive',
      });
    }
  };

  const handleEditChild = (child: Child) => {
    setEditingChild(child);
    childForm.reset(child);
    setChildDialogOpen(true);
  };

  const handleDeleteChild = async (childId: string) => {
    if (!confirm('Tem certeza que deseja remover este filho?')) return;

    try {
      const { error } = await supabase
        .from('student_children_list')
        .delete()
        .eq('id', childId);

      if (error) throw error;

      await fetchChildrenData();

      toast({
        title: 'Sucesso',
        description: 'Filho removido com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao remover filho',
        variant: 'destructive',
      });
    }
  };

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Filhos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="tem_filhos"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Tem filhos</FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {temFilhos && (
              <>
                <FormField
                  control={form.control}
                  name="convive_filhos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Convive com os filhos</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Lista de Filhos ({children.length})</h3>
                    <Dialog open={childDialogOpen} onOpenChange={setChildDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingChild(null);
                            childForm.reset();
                          }}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Filho
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            {editingChild ? 'Editar Filho' : 'Adicionar Filho'}
                          </DialogTitle>
                        </DialogHeader>
                        <Form {...childForm}>
                          <form onSubmit={childForm.handleSubmit(onChildSubmit)} className="space-y-4">
                            <FormField
                              control={childForm.control}
                              name="nome_completo"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Nome Completo</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Nome completo do filho" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={childForm.control}
                              name="data_nascimento"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Data de Nascimento</FormLabel>
                                  <FormControl>
                                    <Input type="date" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setChildDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button type="submit">
                                {editingChild ? 'Atualizar' : 'Adicionar'}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {children.length > 0 ? (
                    <div className="grid gap-3">
                      {children.map((child) => (
                        <div key={child.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{child.nome_completo}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(child.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })} 
                              {' • '}
                              {calculateAge(child.data_nascimento)} anos
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditChild(child)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteChild(child.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum filho cadastrado</p>
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados dos Filhos
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}