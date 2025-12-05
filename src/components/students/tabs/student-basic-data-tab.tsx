import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { studentBasicDataSchema, type StudentBasicDataForm } from '@/lib/student-schemas';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

interface FiliationStatusOption {
  id: string;
  nome: string;
}

interface StudentBasicDataTabProps {
  studentId?: string;
}

export function StudentBasicDataTab({ studentId }: StudentBasicDataTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidadesNascimento, setCidadesNascimento] = useState<Cidade[]>([]);
  const [cidadesEndereco, setCidadesEndereco] = useState<Cidade[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidadesNascimento, setLoadingCidadesNascimento] = useState(false);
  const [loadingCidadesEndereco, setLoadingCidadesEndereco] = useState(false);
  const [filiationStatus, setFiliationStatus] = useState<FiliationStatusOption[]>([]);
  const [loadingFiliationStatus, setLoadingFiliationStatus] = useState(true);

  const form = useForm<StudentBasicDataForm>({
    resolver: zodResolver(studentBasicDataSchema),
    defaultValues: {
      batizado: 'Não',
      estuda: false,
      ha_processos: false,
    },
  });

  useEffect(() => {
    setLoadingEstados(true);
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados')
      .then(response => response.json())
      .then(data => {
        const estadosOrdenados = data.sort((a: Estado, b: Estado) => 
          a.nome.localeCompare(b.nome)
        );
        setEstados(estadosOrdenados);
      })
      .catch(error => {
        console.error('Erro ao carregar estados:', error);
        toast({
          title: 'Erro',
          description: 'Erro ao carregar lista de estados',
          variant: 'destructive',
        });
      })
      .finally(() => setLoadingEstados(false));
  }, []);

  // Fetch filiation status options
  useEffect(() => {
    const fetchFiliationStatus = async () => {
      setLoadingFiliationStatus(true);
      try {
        const { data, error } = await supabase
          .from('filiation_status')
          .select('id, nome')
          .eq('ativo', true)
          .order('ordem', { ascending: true });
        
        if (error) throw error;
        setFiliationStatus((data as FiliationStatusOption[]) || []);
      } catch (error) {
        console.error('Erro ao carregar estados de filiação:', error);
      } finally {
        setLoadingFiliationStatus(false);
      }
    };
    fetchFiliationStatus();
  }, []);

  useEffect(() => {
    const estado = form.watch('estado');
    if (estado) {
      setLoadingCidadesEndereco(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estado}/municipios`)
        .then(response => response.json())
        .then(data => {
          const cidadesOrdenadas = data.sort((a: Cidade, b: Cidade) => 
            a.nome.localeCompare(b.nome)
          );
          setCidadesEndereco(cidadesOrdenadas);
        })
        .catch(error => {
          console.error('Erro ao carregar cidades:', error);
          toast({
            title: 'Erro',
            description: 'Erro ao carregar lista de cidades',
            variant: 'destructive',
          });
        })
        .finally(() => setLoadingCidadesEndereco(false));
    } else {
      setCidadesEndereco([]);
      form.setValue('cidade', '');
    }
  }, [form.watch('estado')]);

  useEffect(() => {
    const estadoNascimento = form.watch('estado_nascimento');
    if (estadoNascimento) {
      setLoadingCidadesNascimento(true);
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoNascimento}/municipios`)
        .then(response => response.json())
        .then(data => {
          const cidadesOrdenadas = data.sort((a: Cidade, b: Cidade) => 
            a.nome.localeCompare(b.nome)
          );
          setCidadesNascimento(cidadesOrdenadas);
        })
        .catch(error => console.error('Erro ao carregar cidades de nascimento:', error))
        .finally(() => setLoadingCidadesNascimento(false));
    } else {
      setCidadesNascimento([]);
      form.setValue('cidade_nascimento', '');
    }
  }, [form.watch('estado_nascimento')]);


  useEffect(() => {
    if (studentId) {
      fetchBasicData();
    } else {
      setLoading(false);
    }
  }, [studentId]);

  const fetchBasicData = async () => {
    try {
      const { data, error } = await supabase
        .from('student_basic_data')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Remove campos do banco que não fazem parte do schema e trata valores nulos
        const formData: StudentBasicDataForm = {
          telefone: data.telefone ?? undefined,
          endereco: data.endereco ?? undefined,
          cep: data.cep ?? undefined,
          numero: data.numero ?? undefined,
          bairro: data.bairro ?? undefined,
          cidade: data.cidade ?? undefined,
          estado: data.estado ?? undefined,
          estado_civil: data.estado_civil ?? undefined,
          religiao: data.religiao ?? undefined,
          batizado: data.batizado ?? 'Não',
          pis_nis: data.pis_nis ?? undefined,
          cartao_sus: data.cartao_sus ?? undefined,
          estado_nascimento: data.estado_nascimento ?? undefined,
          cidade_nascimento: data.cidade_nascimento ?? undefined,
          situacao_moradia: data.situacao_moradia ?? undefined,
          estuda: data.estuda ?? false,
          escolaridade: data.escolaridade ?? undefined,
          nome_pai: data.nome_pai ?? undefined,
          data_nascimento_pai: data.data_nascimento_pai ?? undefined,
          estado_pai: data.estado_pai ?? undefined,
          nome_mae: data.nome_mae ?? undefined,
          data_nascimento_mae: data.data_nascimento_mae ?? undefined,
          estado_mae: data.estado_mae ?? undefined,
          nome_conjuge: data.nome_conjuge ?? undefined,
          data_nascimento_conjuge: data.data_nascimento_conjuge ?? undefined,
          estado_conjuge: data.estado_conjuge ?? undefined,
          ha_processos: data.ha_processos ?? false,
          comarca_juridica: data.comarca_juridica ?? undefined,
          observacoes_juridicas: data.observacoes_juridicas ?? undefined,
        };
        form.reset(formData);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar dados básicos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: StudentBasicDataForm) => {
    if (!studentId) {
      toast({
        title: 'Erro',
        description: 'Salve o aluno primeiro para adicionar dados básicos',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_basic_data')
        .upsert({ ...data, student_id: studentId });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Dados básicos salvos com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar dados básicos',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
        <CardTitle>Dados Básicos</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Contato */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Contato</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cep"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CEP</FormLabel>
                      <FormControl>
                        <Input placeholder="00000-000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua, Avenida..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numero"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número</FormLabel>
                      <FormControl>
                        <Input placeholder="123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bairro</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do bairro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('cidade', '');
                        }} 
                        value={field.value}
                        disabled={loadingEstados}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingEstados ? "Carregando..." : "Selecione"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado.id} value={estado.sigla}>
                              {estado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!form.watch('estado') || loadingCidadesEndereco}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !form.watch('estado') 
                                ? "Selecione o estado primeiro" 
                                : loadingCidadesEndereco 
                                ? "Carregando..." 
                                : "Selecione"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cidadesEndereco.map((cidade) => (
                            <SelectItem key={cidade.id} value={cidade.nome}>
                              {cidade.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Dados Pessoais */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="estado_civil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Civil</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                          <SelectItem value="casado">Casado(a)</SelectItem>
                          <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                          <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                          <SelectItem value="uniao_estavel">União Estável</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="religiao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Religião</FormLabel>
                      <FormControl>
                        <Input placeholder="Religião professada" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="batizado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Batizado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Sim">Sim</SelectItem>
                          <SelectItem value="Não">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="situacao_moradia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação de Moradia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="residencia_propria">Residência Própria</SelectItem>
                          <SelectItem value="residencia_alugada">Residência Alugada</SelectItem>
                          <SelectItem value="mora_com_pais">Mora com os Pais</SelectItem>
                          <SelectItem value="mora_com_parentes">Mora com os Parentes</SelectItem>
                          <SelectItem value="casa_passagem">Estava em Casa de Passagem</SelectItem>
                          <SelectItem value="casa_apoio">Estava em Casa de Apoio</SelectItem>
                          <SelectItem value="clinica_reabilitacao">Estava em Clínica de Reabilitação</SelectItem>
                          <SelectItem value="situacao_rua">Situação de Rua</SelectItem>
                          <SelectItem value="residencia_pastoral">Residência Pastoral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estuda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estuda</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'true')} 
                        value={field.value ? 'true' : 'false'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="escolaridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolaridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="analfabeto">Analfabeto</SelectItem>
                          <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                          <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                          <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                          <SelectItem value="medio_completo">Médio Completo</SelectItem>
                          <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                          <SelectItem value="superior_completo">Superior Completo</SelectItem>
                          <SelectItem value="pos_graduacao">Pós-graduação</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pis_nis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIS/NIS</FormLabel>
                      <FormControl>
                        <Input placeholder="000.00000.00-0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cartao_sus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cartão SUS</FormLabel>
                      <FormControl>
                        <Input placeholder="000 0000 0000 0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Naturalidade */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Naturalidade</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estado_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Nascimento</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('cidade_nascimento', '');
                        }} 
                        value={field.value}
                        disabled={loadingEstados}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingEstados ? "Carregando..." : "Selecione"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado.id} value={estado.sigla}>
                              {estado.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade_nascimento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade Nascimento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!form.watch('estado_nascimento') || loadingCidadesNascimento}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={
                              !form.watch('estado_nascimento') 
                                ? "Selecione o estado primeiro" 
                                : loadingCidadesNascimento 
                                ? "Carregando..." 
                                : "Selecione"
                            } />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cidadesNascimento.map((cidade) => (
                            <SelectItem key={cidade.id} value={cidade.nome}>
                              {cidade.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Filiação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filiação</h3>
              
              {/* Mãe */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_mae"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da mãe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento_mae"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Nascimento Mãe</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_mae"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Filiação Mãe</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loadingFiliationStatus}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingFiliationStatus ? "Carregando..." : "Selecione"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filiationStatus.map((status) => (
                            <SelectItem key={status.id} value={status.nome}>
                              {status.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pai */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_pai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Pai</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do pai" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento_pai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Nascimento Pai</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_pai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Filiação Pai</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={loadingFiliationStatus}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingFiliationStatus ? "Carregando..." : "Selecione"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filiationStatus.map((status) => (
                            <SelectItem key={status.id} value={status.nome}>
                              {status.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Esposa */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_conjuge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Esposa</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da esposa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento_conjuge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Nascimento Esposa</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estado_conjuge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado Filiação Esposa</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="presente">Presente</SelectItem>
                          <SelectItem value="falecida">Falecida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Situação Jurídica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Situação Jurídica</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="ha_processos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Há Processos</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === 'true')} 
                        value={field.value ? 'true' : 'false'}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comarca_juridica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comarca</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome da comarca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes_juridicas"
                  render={({ field }) => (
                    <FormItem className="md:col-span-3">
                      <FormLabel>Observações Jurídicas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Processos, medidas judiciais, etc."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados Básicos
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}