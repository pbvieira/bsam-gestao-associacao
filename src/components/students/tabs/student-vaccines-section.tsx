import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useStudentVaccines } from '@/hooks/use-student-vaccines';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Syringe, Info, Check, X, Minus } from 'lucide-react';

interface StudentVaccinesSectionProps {
  studentId?: string | null;
}

export function StudentVaccinesSection({ studentId }: StudentVaccinesSectionProps) {
  const { vaccines, vaccineTypes, loading, saveVaccine, deleteVaccine, getVaccineStatus } = useStudentVaccines(studentId || undefined);
  const { toast } = useToast();
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({});

  // Count statistics
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
        // Delete the record if set to "Não informado"
        await deleteVaccine(vaccineTypeId);
      } else {
        const tomou = value === 'true';
        await saveVaccine({
          vaccine_type_id: vaccineTypeId,
          tomou,
          data_vacinacao: null,
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar status da vacina',
        variant: 'destructive',
      });
    } finally {
      setSavingStates(prev => ({ ...prev, [vaccineTypeId]: false }));
    }
  };

  const handleDateChange = async (vaccineTypeId: string, date: string) => {
    if (!studentId) return;

    const status = getVaccineStatus(vaccineTypeId);
    if (status.tomou !== true) return; // Only save date if tomou = true

    setSavingStates(prev => ({ ...prev, [vaccineTypeId]: true }));

    try {
      await saveVaccine({
        vaccine_type_id: vaccineTypeId,
        tomou: true,
        data_vacinacao: date || null,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar data da vacina',
        variant: 'destructive',
      });
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
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Syringe className="h-5 w-5" />
          Vacinas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!studentId && (
          <p className="text-sm text-muted-foreground">
            Salve o aluno primeiro para registrar as vacinas.
          </p>
        )}

        {studentId && vaccineTypes.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum tipo de vacina cadastrado. Configure os tipos de vacinas em Tabelas Auxiliares.
          </p>
        )}

        {studentId && vaccineTypes.length > 0 && (
          <TooltipProvider>
            <div className="space-y-3">
              {vaccineTypes.map((type) => {
                const status = getVaccineStatus(type.id);
                const isSaving = savingStates[type.id];
                const selectValue = status.tomou === null ? 'null' : status.tomou.toString();

                return (
                  <div
                    key={type.id}
                    className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: type.cor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{type.nome}</span>
                        {type.informacao_adicional && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-blue-500 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{type.informacao_adicional}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      {type.descricao && (
                        <p className="text-xs text-muted-foreground truncate">{type.descricao}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Select
                        value={selectValue}
                        onValueChange={(value) => handleStatusChange(type.id, value)}
                        disabled={isSaving}
                      >
                        <SelectTrigger className="w-[140px]">
                          {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <SelectValue>
                              {status.tomou === null && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Minus className="h-3 w-3" /> Não informado
                                </span>
                              )}
                              {status.tomou === true && (
                                <span className="flex items-center gap-1 text-green-600">
                                  <Check className="h-3 w-3" /> Sim
                                </span>
                              )}
                              {status.tomou === false && (
                                <span className="flex items-center gap-1 text-red-600">
                                  <X className="h-3 w-3" /> Não
                                </span>
                              )}
                            </SelectValue>
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Minus className="h-3 w-3" /> Não informado
                            </span>
                          </SelectItem>
                          <SelectItem value="true">
                            <span className="flex items-center gap-1 text-green-600">
                              <Check className="h-3 w-3" /> Sim
                            </span>
                          </SelectItem>
                          <SelectItem value="false">
                            <span className="flex items-center gap-1 text-red-600">
                              <X className="h-3 w-3" /> Não
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      {status.tomou === true && (
                        <Input
                          type="date"
                          className="w-[140px]"
                          value={status.data || ''}
                          onChange={(e) => handleDateChange(type.id, e.target.value)}
                          disabled={isSaving}
                          placeholder="Data"
                        />
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Statistics summary */}
              <div className="flex items-center gap-4 pt-4 mt-4 border-t">
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                  ✅ {stats.tomadas} {stats.tomadas === 1 ? 'tomada' : 'tomadas'}
                </Badge>
                <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-200">
                  ❌ {stats.naoTomadas} não {stats.naoTomadas === 1 ? 'tomada' : 'tomadas'}
                </Badge>
                <Badge variant="outline" className="bg-muted text-muted-foreground">
                  ⚪ {stats.naoInformadas} não {stats.naoInformadas === 1 ? 'informada' : 'informadas'}
                </Badge>
              </div>
            </div>
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}
