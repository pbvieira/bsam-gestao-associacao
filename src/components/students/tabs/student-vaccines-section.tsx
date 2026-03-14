import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useStudentVaccines } from '@/hooks/use-student-vaccines';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Syringe, Info, Check, X, Minus, HelpCircle } from 'lucide-react';

interface StudentVaccinesSectionProps {
  studentId?: string | null;
}

export function StudentVaccinesSection({ studentId }: StudentVaccinesSectionProps) {
  const { vaccines, vaccineTypes, loading, saveVaccine, deleteVaccine, getVaccineStatus } = useStudentVaccines(studentId || undefined);
  const { toast } = useToast();
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  const stats = vaccineTypes.reduce(
    (acc, type) => {
      const status = getVaccineStatus(type.id);
      if (status.tomou === true) acc.tomadas++;
      else if (status.tomou === false) acc.naoTomadas++;
      else acc.naoInformadas++;
      return acc;
    },
    { tomadas: 0, naoTomadas: 0, naoInformadas: 0 }
  );

  const handleStatusChange = async (vaccineTypeId: string, value: string) => {
    if (!studentId) return;
    setSavingStates(prev => ({ ...prev, [vaccineTypeId]: true }));
    try {
      if (value === 'null') {
        await deleteVaccine(vaccineTypeId);
      } else {
        await saveVaccine({
          vaccine_type_id: vaccineTypeId,
          tomou: value === 'true',
          data_vacinacao: null,
        });
      }
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar status da vacina', variant: 'destructive' });
    } finally {
      setSavingStates(prev => ({ ...prev, [vaccineTypeId]: false }));
    }
  };

  const handleDateChange = async (vaccineTypeId: string, date: string) => {
    if (!studentId) return;
    const status = getVaccineStatus(vaccineTypeId);
    if (status.tomou !== true) return;
    setSavingStates(prev => ({ ...prev, [vaccineTypeId]: true }));
    try {
      await saveVaccine({ vaccine_type_id: vaccineTypeId, tomou: true, data_vacinacao: date || null });
    } catch (error) {
      toast({ title: 'Erro', description: 'Erro ao salvar data da vacina', variant: 'destructive' });
    } finally {
      setSavingStates(prev => ({ ...prev, [vaccineTypeId]: false }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando vacinas...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Syringe className="h-5 w-5" />
            Vacinas
          </CardTitle>
          {studentId && vaccineTypes.length > 0 && (
            <div className="flex items-center gap-2">
              {stats.tomadas > 0 && (
                <Badge variant="secondary" className="text-xs">
                  <Check className="mr-1 h-3 w-3" />
                  {stats.tomadas} Sim
                </Badge>
              )}
              {stats.naoTomadas > 0 && (
                <Badge variant="destructive" className="text-xs">
                  <X className="mr-1 h-3 w-3" />
                  {stats.naoTomadas} Não
                </Badge>
              )}
              {stats.naoInformadas > 0 && (
                <Badge variant="outline" className="text-xs">
                  <HelpCircle className="mr-1 h-3 w-3" />
                  {stats.naoInformadas} Não informado
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!studentId && (
          <p className="text-sm text-muted-foreground">
            Salve o aluno primeiro para registrar as vacinas.
          </p>
        )}

        {studentId && vaccineTypes.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhum tipo de vacina cadastrado. Configure os tipos em Tabelas Auxiliares.
          </p>
        )}

        {studentId && vaccineTypes.length > 0 && (
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vacina</TableHead>
                  <TableHead className="w-[140px]">Status</TableHead>
                  <TableHead className="w-[140px]">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vaccineTypes.map((type) => {
                  const status = getVaccineStatus(type.id);
                  const isSaving = savingStates[type.id];
                  const selectValue = status.tomou === null ? 'null' : status.tomou.toString();

                  return (
                    <TableRow key={type.id}>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: type.cor }} />
                          <span className="text-sm font-medium">{type.nome}</span>
                          {type.informacao_adicional && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p>{type.informacao_adicional}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <Select value={selectValue} onValueChange={(v) => handleStatusChange(type.id, v)} disabled={isSaving}>
                          <SelectTrigger className="h-8 w-[130px]">
                            {isSaving ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <SelectValue />
                            )}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="null">
                              <span className="flex items-center gap-1 text-muted-foreground"><Minus className="h-3 w-3" /> -</span>
                            </SelectItem>
                            <SelectItem value="true">
                              <span className="flex items-center gap-1 text-green-600"><Check className="h-3 w-3" /> Sim</span>
                            </SelectItem>
                            <SelectItem value="false">
                              <span className="flex items-center gap-1 text-red-600"><X className="h-3 w-3" /> Não</span>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="py-2">
                        {status.tomou === true ? (
                          <Input
                            type="date"
                            className="h-8 w-[130px]"
                            value={status.data || ''}
                            onChange={(e) => handleDateChange(type.id, e.target.value)}
                            disabled={isSaving}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
