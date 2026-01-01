import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useStudentFormContext } from '@/contexts/StudentFormContext';

// Estados de filiação que tornam a data de nascimento automaticamente opcional
const ESTADOS_DATA_OPCIONAL = ['Desconhecido(a)', 'Não declarado(a) no registro'];

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
  studentId?: string | null;
}

export function StudentBasicDataTab({ studentId }: StudentBasicDataTabProps) {
  const { toast } = useToast();
  const { basicDataForm: form, isLoading } = useStudentFormContext();
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidadesNascimento, setCidadesNascimento] = useState<Cidade[]>([]);
  const [cidadesEndereco, setCidadesEndereco] = useState<Cidade[]>([]);
  const [loadingEstados, setLoadingEstados] = useState(true);
  const [loadingCidadesNascimento, setLoadingCidadesNascimento] = useState(false);
  const [loadingCidadesEndereco, setLoadingCidadesEndereco] = useState(false);
  const [filiationStatus, setFiliationStatus] = useState<FiliationStatusOption[]>([]);
  const [loadingFiliationStatus, setLoadingFiliationStatus] = useState(true);

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

  // Limpar data e checkbox quando estado da mãe muda para automático
  const estadoMae = form.watch('estado_mae');
  useEffect(() => {
    if (ESTADOS_DATA_OPCIONAL.includes(estadoMae || '')) {
      form.setValue('data_nascimento_mae', '');
      form.setValue('data_nascimento_mae_desconhecida', false);
    }
  }, [estadoMae]);

  // Limpar data e checkbox quando estado do pai muda para automático
  const estadoPai = form.watch('estado_pai');
  useEffect(() => {
    if (ESTADOS_DATA_OPCIONAL.includes(estadoPai || '')) {
      form.setValue('data_nascimento_pai', '');
      form.setValue('data_nascimento_pai_desconhecida', false);
    }
  }, [estadoPai]);

  if (isLoading) {
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
          <div className="space-y-6">
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
                        <Input placeholder="(00) 00000-0000" {...field} value={field.value || ''} />
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
                        <Input placeholder="00000-000" {...field} value={field.value || ''} />
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
                        <Input placeholder="Rua, Avenida..." {...field} value={field.value || ''} />
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
                        <Input placeholder="123" {...field} value={field.value || ''} />
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
                        <Input placeholder="Nome do bairro" {...field} value={field.value || ''} />
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
                        value={field.value || ''}
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
                        value={field.value || ''}
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
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        <Input placeholder="Religião" {...field} value={field.value || ''} />
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
                      <Select onValueChange={field.onChange} value={field.value || 'Não'}>
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
                  name="pis_nis"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIS/NIS</FormLabel>
                      <FormControl>
                        <Input placeholder="Número PIS/NIS" {...field} value={field.value || ''} />
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
                        <Input placeholder="Número do Cartão SUS" {...field} value={field.value || ''} />
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
                      <FormLabel>Estado de Nascimento</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('cidade_nascimento', '');
                        }} 
                        value={field.value || ''}
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
                      <FormLabel>Cidade de Nascimento</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value || ''}
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

            {/* Moradia */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Moradia</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="situacao_moradia"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Situação de Moradia</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="propria">Casa Própria</SelectItem>
                          <SelectItem value="alugada">Alugada</SelectItem>
                          <SelectItem value="cedida">Cedida</SelectItem>
                          <SelectItem value="financiada">Financiada</SelectItem>
                          <SelectItem value="situacao_rua">Situação de Rua</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Educação */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Educação</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="estuda"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estuda atualmente</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
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
                  name="escolaridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Escolaridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="nao_alfabetizado">Não Alfabetizado</SelectItem>
                          <SelectItem value="fundamental_incompleto">Fundamental Incompleto</SelectItem>
                          <SelectItem value="fundamental_completo">Fundamental Completo</SelectItem>
                          <SelectItem value="medio_incompleto">Médio Incompleto</SelectItem>
                          <SelectItem value="medio_completo">Médio Completo</SelectItem>
                          <SelectItem value="superior_incompleto">Superior Incompleto</SelectItem>
                          <SelectItem value="superior_completo">Superior Completo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Filiação - Pai */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filiação - Pai</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_pai"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Nome do Pai</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do pai" {...field} value={field.value || ''} />
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
                      <FormLabel>Estado do Pai</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={loadingFiliationStatus}>
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

                <FormField
                  control={form.control}
                  name="data_nascimento_pai"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                          disabled={form.watch('data_nascimento_pai_desconhecida')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!ESTADOS_DATA_OPCIONAL.includes(estadoPai || '') && (
                  <FormField
                    control={form.control}
                    name="data_nascimento_pai_desconhecida"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Não sabe</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Filiação - Mãe */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Filiação - Mãe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_mae"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Nome da Mãe</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo da mãe" {...field} value={field.value || ''} />
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
                      <FormLabel>Estado da Mãe</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={loadingFiliationStatus}>
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

                <FormField
                  control={form.control}
                  name="data_nascimento_mae"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                          disabled={form.watch('data_nascimento_mae_desconhecida')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!ESTADOS_DATA_OPCIONAL.includes(estadoMae || '') && (
                  <FormField
                    control={form.control}
                    name="data_nascimento_mae_desconhecida"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Não sabe</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Cônjuge */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Cônjuge</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="nome_conjuge"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Nome do Cônjuge</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome completo do cônjuge" {...field} value={field.value || ''} />
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
                      <FormLabel>Estado do Cônjuge</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ''} disabled={loadingFiliationStatus}>
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

                <FormField
                  control={form.control}
                  name="data_nascimento_conjuge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Nascimento</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ''} 
                          disabled={form.watch('data_nascimento_conjuge_desconhecida')}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="data_nascimento_conjuge_desconhecida"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Não sabe</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Situação Jurídica */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Situação Jurídica</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ha_processos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Possui processos judiciais</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="comarca_juridica"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comarca Jurídica</FormLabel>
                      <FormControl>
                        <Input placeholder="Comarca" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="observacoes_juridicas"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Observações Jurídicas</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Processos, medidas judiciais, etc."
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
