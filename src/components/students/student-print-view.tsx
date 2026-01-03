import { useEffect, useState } from 'react';
import { format, parseISO, isValid, differenceInYears, differenceInDays, differenceInMonths, addYears, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useStudentBasicData } from '@/hooks/use-student-basic-data';
import { useStudentChildren } from '@/hooks/use-student-children';
import { useStudentWorkSituation } from '@/hooks/use-student-work-situation';
import { useStudentIncome } from '@/hooks/use-student-income';
import { useStudentBenefits } from '@/hooks/use-student-benefits';
import { useStudentEmergencyContacts } from '@/hooks/use-student-emergency-contacts';
import { useStudentHealthData } from '@/hooks/use-student-health-data';
import { useStudentDiseases } from '@/hooks/use-student-diseases';
import { useStudentDisabilities } from '@/hooks/use-student-disabilities';
import { useStudentVaccines } from '@/hooks/use-student-vaccines';
import { useStudentMedications } from '@/hooks/use-student-medications';
import { useStudentHospitalizations, HOSPITALIZATION_TYPES } from '@/hooks/use-student-hospitalizations';
import { useStudentMedicalRecords, MEDICAL_RECORD_TYPES } from '@/hooks/use-student-medical-records';
import { Loader2, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Student {
  id: string;
  codigo_cadastro: string;
  nome_completo: string;
  data_nascimento: string;
  cpf: string | null;
  rg: string | null;
  numero_interno: string | null;
  hora_entrada: string | null;
  data_abertura: string;
  data_saida: string | null;
  hora_saida: string | null;
  nome_responsavel: string | null;
  parentesco_responsavel: string | null;
  ativo: boolean;
}

interface StudentPrintViewProps {
  studentId: string;
}

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    return isValid(date) ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : '-';
  } catch {
    return '-';
  }
};

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return 'R$ 0,00';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const calculateAge = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  try {
    const date = parseISO(dateStr);
    if (!isValid(date)) return '-';
    return `${differenceInYears(new Date(), date)} anos`;
  } catch {
    return '-';
  }
};

const calculatePermanencia = (dataAbertura?: string, dataSaida?: string): string => {
  if (!dataAbertura || dataAbertura.trim() === '') return '-';
  
  const inicio = parseISO(dataAbertura);
  if (!isValid(inicio)) return '-';
  
  let fim: Date;
  if (dataSaida && dataSaida.trim() !== '') {
    const dataParte = dataSaida.split('T')[0];
    const dataSaidaParsed = parseISO(dataParte);
    fim = isValid(dataSaidaParsed) ? dataSaidaParsed : new Date();
  } else {
    fim = new Date();
  }
  
  const totalDias = differenceInDays(fim, inicio);
  
  if (totalDias < 0) return 'Data inválida';
  if (totalDias === 0) return 'Hoje';
  if (totalDias === 1) return '1 dia';
  if (totalDias < 30) return `${totalDias} dias`;
  
  const anos = differenceInYears(fim, inicio);
  const mesesTotais = differenceInMonths(fim, inicio);
  const meses = mesesTotais % 12;
  
  let dataAposMeses = addYears(inicio, anos);
  dataAposMeses = addMonths(dataAposMeses, meses);
  const diasRestantes = differenceInDays(fim, dataAposMeses);
  
  let result = '';
  
  if (anos > 0) {
    result = `${anos} ${anos === 1 ? 'ano' : 'anos'}`;
  }
  
  if (meses > 0) {
    if (result) result += ', ';
    result += `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }
  
  if (diasRestantes > 0) {
    if (result) result += ' e ';
    result += `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
  }
  
  return result || 'Hoje';
};

export function StudentPrintView({ studentId }: StudentPrintViewProps) {
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { basicData, loading: loadingBasic } = useStudentBasicData(studentId);
  const { children, loading: loadingChildren } = useStudentChildren(studentId);
  const { workSituation, loading: loadingWork } = useStudentWorkSituation(studentId);
  const { incomeList, totalIncome, loading: loadingIncome } = useStudentIncome(studentId);
  const { benefitsList, totalBenefits, loading: loadingBenefits } = useStudentBenefits(studentId);
  const { contacts, loading: loadingContacts } = useStudentEmergencyContacts(studentId);
  const { healthData, loading: loadingHealth } = useStudentHealthData(studentId);
  const { diseaseTypes, studentDiseases, getDiseaseStatus, isLoading: loadingDiseases } = useStudentDiseases(studentId);
  const { disabilityTypes, studentDisabilities, getDisabilityStatus, isLoading: loadingDisabilities } = useStudentDisabilities(studentId);
  const { vaccineTypes, vaccines, getVaccineStatus, loading: loadingVaccines } = useStudentVaccines(studentId);
  const { medications, loading: loadingMedications } = useStudentMedications(studentId);
  const { hospitalizations, loading: loadingHospitalizations } = useStudentHospitalizations(studentId);
  const { medicalRecords, loading: loadingMedicalRecords } = useStudentMedicalRecords(studentId);

  useEffect(() => {
    const fetchStudent = async () => {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
      
      if (!error && data) {
        setStudent(data);
      }
      setLoading(false);
    };
    
    fetchStudent();
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loading || loadingBasic || loadingChildren || loadingWork || 
    loadingIncome || loadingBenefits || loadingContacts || loadingHealth ||
    loadingDiseases || loadingDisabilities || loadingVaccines || loadingMedications ||
    loadingHospitalizations || loadingMedicalRecords;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Carregando dados...</span>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Aluno não encontrado.</p>
      </div>
    );
  }

  const rendaPerCapita = workSituation?.quantidade_pessoas_residencia 
    ? (totalIncome + totalBenefits) / workSituation.quantidade_pessoas_residencia 
    : 0;

  return (
    <div className="print-container bg-background min-h-screen">
      {/* Print Button - Hidden when printing */}
      <div className="print:hidden fixed top-4 right-4 z-50">
        <Button onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Print Content */}
      <div className="max-w-4xl mx-auto p-8 print:p-4 print:max-w-none">
        {/* Header */}
        <header className="text-center border-b-2 border-foreground pb-4 mb-6">
          <h1 className="text-2xl font-bold uppercase tracking-wide">Ficha Cadastral do Assistido</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Impresso em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
          {student.numero_interno && (
            <p className="text-sm font-medium mt-1">N° Interno: {student.numero_interno}</p>
          )}
        </header>

        {/* Section: Registro */}
        <section className="mb-6 print-section">
          <h2 className="section-title">Dados do Registro</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid">
            <div className="print-field">
              <span className="font-medium">Nome Completo:</span> {student.nome_completo}
            </div>
            <div className="print-field">
              <span className="font-medium">Data de Nascimento:</span> {formatDate(student.data_nascimento)} ({calculateAge(student.data_nascimento)})
            </div>
            <div className="print-field">
              <span className="font-medium">CPF:</span> {student.cpf || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">RG:</span> {student.rg || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Data de Abertura:</span> {formatDate(student.data_abertura)}
            </div>
            <div className="print-field">
              <span className="font-medium">Permanência:</span> {calculatePermanencia(student.data_abertura, student.data_saida)}
            </div>
            <div className="print-field">
              <span className="font-medium">Horário de Entrada:</span> {student.hora_entrada || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Data/Hora de Saída:</span> {student.data_saida ? `${formatDate(student.data_saida)} ${student.hora_saida || ''}` : '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Responsável:</span> {student.nome_responsavel || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Parentesco:</span> {student.parentesco_responsavel || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Status:</span> {student.ativo ? 'Ativo' : 'Inativo'}
            </div>
            <div className="print-field">
              <span className="font-medium">Código:</span> {student.codigo_cadastro}
            </div>
          </div>
        </section>

        {/* Section: Dados Básicos */}
        {basicData && (
          <section className="mb-6 print-section">
            <h2 className="section-title">Dados Básicos</h2>
            
            <h3 className="subsection-title">Contato e Endereço</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid mb-4">
              <div className="print-field">
                <span className="font-medium">Telefone:</span> {basicData.telefone || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">CEP:</span> {basicData.cep || '-'}
              </div>
              <div className="print-field col-span-2">
                <span className="font-medium">Endereço:</span> {basicData.endereco || '-'}{basicData.numero ? `, ${basicData.numero}` : ''}
              </div>
              <div className="print-field">
                <span className="font-medium">Bairro:</span> {basicData.bairro || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Cidade/UF:</span> {basicData.cidade || '-'}{basicData.estado ? `/${basicData.estado}` : ''}
              </div>
            </div>

            <h3 className="subsection-title">Dados Pessoais</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid mb-4">
              <div className="print-field">
                <span className="font-medium">Estado Civil:</span> {basicData.estado_civil || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Religião:</span> {basicData.religiao || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Batizado:</span> {basicData.batizado || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">PIS/NIS:</span> {basicData.pis_nis || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Cartão SUS:</span> {basicData.cartao_sus || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Naturalidade:</span> {basicData.cidade_nascimento || '-'}{basicData.estado_nascimento ? `/${basicData.estado_nascimento}` : ''}
              </div>
              <div className="print-field">
                <span className="font-medium">Situação de Moradia:</span> {basicData.situacao_moradia || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Escolaridade:</span> {basicData.escolaridade || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Estuda atualmente:</span> {basicData.estuda ? 'Sim' : 'Não'}
              </div>
            </div>

            <h3 className="subsection-title">Filiação</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid mb-4">
              <div className="print-field">
                <span className="font-medium">Nome da Mãe:</span> {basicData.nome_mae || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Nasc. Mãe:</span> {basicData.data_nascimento_mae_desconhecida ? 'Não sabe' : formatDate(basicData.data_nascimento_mae)}
              </div>
              <div className="print-field">
                <span className="font-medium">Estado Mãe:</span> {basicData.estado_mae || '-'}
              </div>
              <div className="print-field" />
              <div className="print-field">
                <span className="font-medium">Nome do Pai:</span> {basicData.nome_pai || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Nasc. Pai:</span> {basicData.data_nascimento_pai_desconhecida ? 'Não sabe' : formatDate(basicData.data_nascimento_pai)}
              </div>
              <div className="print-field">
                <span className="font-medium">Estado Pai:</span> {basicData.estado_pai || '-'}
              </div>
              <div className="print-field" />
              <div className="print-field">
                <span className="font-medium">Nome do Cônjuge:</span> {basicData.nome_conjuge || '-'}
              </div>
              <div className="print-field">
                <span className="font-medium">Nasc. Cônjuge:</span> {basicData.data_nascimento_conjuge_desconhecida ? 'Não sabe' : formatDate(basicData.data_nascimento_conjuge)}
              </div>
              <div className="print-field">
                <span className="font-medium">Estado Cônjuge:</span> {basicData.estado_conjuge || '-'}
              </div>
            </div>

            <h3 className="subsection-title">Informações Jurídicas</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid">
              <div className="print-field">
                <span className="font-medium">Há processos:</span> {basicData.ha_processos ? 'Sim' : 'Não'}
              </div>
              <div className="print-field">
                <span className="font-medium">Comarca:</span> {basicData.comarca_juridica || '-'}
              </div>
              {basicData.observacoes_juridicas && (
                <div className="print-field col-span-2">
                  <span className="font-medium">Observações:</span> {basicData.observacoes_juridicas}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section: Filhos */}
        <section className="mb-6 print-section">
          <h2 className="section-title">Filhos</h2>
          {children.length > 0 ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Data de Nascimento</th>
                  <th>Idade</th>
                </tr>
              </thead>
              <tbody>
                {children.map((child) => (
                  <tr key={child.id}>
                    <td>{child.nome_completo}</td>
                    <td>{formatDate(child.data_nascimento)}</td>
                    <td>{calculateAge(child.data_nascimento)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic">Nenhum filho cadastrado.</p>
          )}
        </section>

        {/* Section: Situação de Trabalho */}
        <section className="mb-6 print-section">
          <h2 className="section-title">Situação de Trabalho</h2>
          
          <h3 className="subsection-title">Profissão e Emprego</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid mb-4">
            <div className="print-field">
              <span className="font-medium">Profissão:</span> {workSituation?.profissao || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Situação Trabalhista:</span> {workSituation?.situacao_trabalhista || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Empresa:</span> {workSituation?.empresa || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Função:</span> {workSituation?.funcao || '-'}
            </div>
            <div className="print-field">
              <span className="font-medium">Data Admissão:</span> {formatDate(workSituation?.data_admissao)}
            </div>
            <div className="print-field">
              <span className="font-medium">Contato Empresa:</span> {workSituation?.contato_empresa || '-'}
            </div>
          </div>

          <h3 className="subsection-title">Composição Familiar</h3>
          <div className="print-field mb-4">
            <span className="font-medium">Pessoas na residência:</span> {workSituation?.quantidade_pessoas_residencia || '-'}
          </div>

          <h3 className="subsection-title">Rendas</h3>
          {incomeList.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {incomeList.map((income) => (
                  <tr key={income.id}>
                    <td>{income.tipo_renda}</td>
                    <td>{income.descricao || '-'}</td>
                    <td className="text-right">{formatCurrency(income.valor)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={2}>Total de Rendas</td>
                  <td className="text-right">{formatCurrency(totalIncome)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhuma renda cadastrada.</p>
          )}

          <h3 className="subsection-title">Benefícios</h3>
          {benefitsList.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Descrição</th>
                  <th className="text-right">Valor</th>
                </tr>
              </thead>
              <tbody>
                {benefitsList.map((benefit) => (
                  <tr key={benefit.id}>
                    <td>{benefit.tipo_beneficio}</td>
                    <td>{benefit.descricao || '-'}</td>
                    <td className="text-right">{formatCurrency(benefit.valor)}</td>
                  </tr>
                ))}
                <tr className="font-medium">
                  <td colSpan={2}>Total de Benefícios</td>
                  <td className="text-right">{formatCurrency(totalBenefits)}</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum benefício cadastrado.</p>
          )}

          <h3 className="subsection-title">Resumo Financeiro</h3>
          <div className="grid grid-cols-3 gap-4 print-grid">
            <div className="print-field">
              <span className="font-medium">Total Rendas:</span> {formatCurrency(totalIncome)}
            </div>
            <div className="print-field">
              <span className="font-medium">Total Benefícios:</span> {formatCurrency(totalBenefits)}
            </div>
            <div className="print-field">
              <span className="font-medium">Renda Per Capita:</span> {formatCurrency(rendaPerCapita)}
            </div>
          </div>
        </section>

        {/* Section: Contatos de Emergência */}
        <section className="mb-6 print-section">
          <h2 className="section-title">Contatos de Emergência</h2>
          {contacts.length > 0 ? (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  <th>Parentesco</th>
                  <th>Endereço</th>
                  <th>Avisar</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id}>
                    <td>{contact.nome}</td>
                    <td>{contact.telefone}</td>
                    <td>{contact.parentesco || '-'}</td>
                    <td>{contact.endereco || '-'}</td>
                    <td>{contact.avisar_contato ? 'Sim' : 'Não'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic">Nenhum contato cadastrado.</p>
          )}
        </section>

        {/* Section: Saúde */}
        <section className="mb-6 print-section page-break-before">
          <h2 className="section-title">Saúde</h2>
          
          {/* Doenças */}
          <h3 className="subsection-title">Doenças</h3>
          {diseaseTypes.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Doença</th>
                  <th>Status</th>
                  <th>Data Diagnóstico</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {diseaseTypes.map((type) => {
                  const status = getDiseaseStatus(type.id);
                  return (
                    <tr key={type.id}>
                      <td>{type.nome}</td>
                      <td>{status ? (status.possui ? 'Sim' : 'Não') : '-'}</td>
                      <td>{status?.data_diagnostico ? formatDate(status.data_diagnostico) : '-'}</td>
                      <td>{status?.observacoes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum tipo de doença cadastrado.</p>
          )}

          {/* Deficiências */}
          <h3 className="subsection-title">Deficiências</h3>
          {disabilityTypes.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Deficiência</th>
                  <th>Status</th>
                  <th>Data Diagnóstico</th>
                  <th>Observações</th>
                </tr>
              </thead>
              <tbody>
                {disabilityTypes.map((type) => {
                  const status = getDisabilityStatus(type.id);
                  return (
                    <tr key={type.id}>
                      <td>{type.nome}</td>
                      <td>{status ? (status.possui ? 'Sim' : 'Não') : '-'}</td>
                      <td>{status?.data_diagnostico ? formatDate(status.data_diagnostico) : '-'}</td>
                      <td>{status?.observacoes || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum tipo de deficiência cadastrado.</p>
          )}

          {/* Vacinas */}
          <h3 className="subsection-title">Vacinas</h3>
          {vaccineTypes.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Vacina</th>
                  <th>Tomou</th>
                  <th>Data</th>
                </tr>
              </thead>
              <tbody>
                {vaccineTypes.map((type) => {
                  const status = getVaccineStatus(type.id);
                  return (
                    <tr key={type.id}>
                      <td>{type.nome}</td>
                      <td>{status.tomou === null ? '-' : status.tomou ? 'Sim' : 'Não'}</td>
                      <td>{status.data ? formatDate(status.data) : '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum tipo de vacina cadastrado.</p>
          )}

          {/* Medicamentos */}
          <h3 className="subsection-title">Medicamentos</h3>
          {medications.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Medicamento</th>
                  <th>Dosagem</th>
                  <th>Tipo de Uso</th>
                  <th>Início</th>
                  <th>Horários</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {medications.map((med) => (
                  <tr key={med.id}>
                    <td>{med.nome_medicamento}</td>
                    <td>{med.dosagem || '-'}</td>
                    <td>{med.tipo_uso?.nome || '-'}</td>
                    <td>{formatDate(med.data_inicio)}</td>
                    <td>{med.schedules?.map(s => s.horario).join(', ') || '-'}</td>
                    <td>{med.ativo ? 'Ativo' : 'Inativo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum medicamento cadastrado.</p>
          )}

          {/* Internações */}
          <h3 className="subsection-title">Histórico de Internações</h3>
          {hospitalizations.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Período</th>
                  <th>Tipo</th>
                  <th>Local</th>
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {hospitalizations.map((hosp) => {
                  const tipoLabel = HOSPITALIZATION_TYPES.find(t => t.value === hosp.tipo_internacao)?.label || hosp.tipo_internacao;
                  return (
                    <tr key={hosp.id}>
                      <td>{formatDate(hosp.data_entrada)} - {hosp.data_saida ? formatDate(hosp.data_saida) : 'Atual'}</td>
                      <td>{tipoLabel}</td>
                      <td>{hosp.local || '-'}</td>
                      <td>{hosp.motivo}</td>
                      <td>{hosp.diagnostico || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhuma internação registrada.</p>
          )}

          {/* Prontuário */}
          <h3 className="subsection-title">Prontuário Médico</h3>
          {medicalRecords.length > 0 ? (
            <table className="print-table mb-4">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th>Especialidade</th>
                  <th>Profissional</th>
                  <th>Diagnóstico</th>
                </tr>
              </thead>
              <tbody>
                {medicalRecords.map((record) => {
                  const tipoLabel = MEDICAL_RECORD_TYPES.find(t => t.value === record.tipo_atendimento)?.label || record.tipo_atendimento;
                  return (
                    <tr key={record.id}>
                      <td>{formatDate(record.data_atendimento)}</td>
                      <td>{tipoLabel}</td>
                      <td>{record.especialidade || '-'}</td>
                      <td>{record.profissional || '-'}</td>
                      <td>{record.diagnostico || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p className="text-muted-foreground italic mb-4">Nenhum atendimento registrado.</p>
          )}

          {/* Saúde Mental */}
          {healthData && (
            <>
              <h3 className="subsection-title">Saúde Mental</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid mb-4">
                <div className="print-field">
                  <span className="font-medium">Acompanhamento Psicológico:</span> {healthData.acompanhamento_psicologico ? 'Sim' : 'Não'}
                </div>
                <div className="print-field">
                  <span className="font-medium">Tentativa de Suicídio:</span> {healthData.tentativa_suicidio ? 'Sim' : 'Não'}
                </div>
                <div className="print-field">
                  <span className="font-medium">Histórico de Surtos:</span> {healthData.historico_surtos ? 'Sim' : 'Não'}
                </div>
                <div className="print-field">
                  <span className="font-medium">Alucinações:</span> {healthData.alucinacoes ? 'Sim' : 'Não'}
                </div>
                <div className="print-field">
                  <span className="font-medium">Dep. Química na Família:</span> {healthData.dependencia_quimica_familia ? 'Sim' : 'Não'}
                </div>
                {healthData.detalhes_acompanhamento && (
                  <div className="print-field col-span-2">
                    <span className="font-medium">Detalhes Acompanhamento:</span> {healthData.detalhes_acompanhamento}
                  </div>
                )}
                {healthData.detalhes_dependencia_familia && (
                  <div className="print-field col-span-2">
                    <span className="font-medium">Detalhes Dep. Família:</span> {healthData.detalhes_dependencia_familia}
                  </div>
                )}
              </div>

              <h3 className="subsection-title">Tratamentos</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 print-grid">
                <div className="print-field">
                  <span className="font-medium">Vacinação Atualizada:</span> {healthData.vacinacao_atualizada ? 'Sim' : 'Não'}
                </div>
                <div className="print-field">
                  <span className="font-medium">Tratamento Odontológico:</span> {healthData.tratamento_odontologico ? 'Sim' : 'Não'}
                </div>
                {healthData.observacoes_odontologicas && (
                  <div className="print-field col-span-2">
                    <span className="font-medium">Obs. Odontológicas:</span> {healthData.observacoes_odontologicas}
                  </div>
                )}
                {healthData.observacoes_gerais && (
                  <div className="print-field col-span-2">
                    <span className="font-medium">Observações Gerais:</span> {healthData.observacoes_gerais}
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-4 border-t text-center text-sm text-muted-foreground print:mt-8">
          <p>Documento gerado automaticamente pelo sistema.</p>
          <p>Código do Aluno: {student.codigo_cadastro}</p>
        </footer>
      </div>
    </div>
  );
}
