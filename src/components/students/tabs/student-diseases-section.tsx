import { HeartPulse, Info, Check, X, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useStudentDiseases } from "@/hooks/use-student-diseases";

interface StudentDiseasesSectionProps {
  studentId?: string;
}

export function StudentDiseasesSection({ studentId }: StudentDiseasesSectionProps) {
  const { diseaseTypes, isLoading, saveDisease, deleteDisease, getDiseaseStatus, getStats } = useStudentDiseases(studentId);
  const stats = getStats();

  const handleStatusChange = (diseaseTypeId: string, value: string) => {
    if (!studentId) return;
    if (value === "nao_informado") {
      deleteDisease({ studentId, diseaseTypeId });
    } else {
      const existing = getDiseaseStatus(diseaseTypeId);
      saveDisease({
        student_id: studentId,
        disease_type_id: diseaseTypeId,
        possui: value === "sim",
        observacoes: value === "sim" ? (existing?.observacoes ?? null) : null,
      });
    }
  };

  const handleObservacoesChange = (diseaseTypeId: string, observacoes: string) => {
    if (!studentId) return;
    saveDisease({
      student_id: studentId,
      disease_type_id: diseaseTypeId,
      possui: true,
      observacoes: observacoes || null,
    });
  };

  const getStatusValue = (diseaseTypeId: string): string => {
    const status = getDiseaseStatus(diseaseTypeId);
    if (!status) return "nao_informado";
    return status.possui ? "sim" : "nao";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (diseaseTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5" />
            Doenças
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum tipo de doença cadastrado. Configure os tipos em Tabelas Auxiliares.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <HeartPulse className="h-5 w-5" />
            Doenças
          </CardTitle>
          <div className="flex items-center gap-2">
            {stats.positivas > 0 && (
              <Badge variant="destructive" className="text-xs">
                <Check className="mr-1 h-3 w-3" />{stats.positivas} Sim
              </Badge>
            )}
            {stats.negativas > 0 && (
              <Badge variant="secondary" className="text-xs">
                <X className="mr-1 h-3 w-3" />{stats.negativas} Não
              </Badge>
            )}
            {stats.naoInformadas > 0 && (
              <Badge variant="outline" className="text-xs">
                <HelpCircle className="mr-1 h-3 w-3" />{stats.naoInformadas} Não informado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doença</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diseaseTypes.map((disease) => {
                const statusValue = getStatusValue(disease.id);
                const diseaseStatus = getDiseaseStatus(disease.id);
                return (
                  <TableRow key={disease.id}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: disease.cor }} />
                        <span className="text-sm font-medium">{disease.nome}</span>
                        {disease.informacao_adicional && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{disease.informacao_adicional}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select value={statusValue} onValueChange={(v) => handleStatusChange(disease.id, v)} disabled={!studentId}>
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">
                            <span className="flex items-center gap-2"><Check className="h-3 w-3 text-red-500" /> Sim</span>
                          </SelectItem>
                          <SelectItem value="nao">
                            <span className="flex items-center gap-2"><X className="h-3 w-3 text-green-500" /> Não</span>
                          </SelectItem>
                          <SelectItem value="nao_informado">
                            <span className="flex items-center gap-2"><HelpCircle className="h-3 w-3 text-muted-foreground" /> -</span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-2">
                      {statusValue === "sim" && (
                        <Input
                          className="h-8 text-sm"
                          placeholder="Observações..."
                          defaultValue={diseaseStatus?.observacoes ?? ""}
                          onBlur={(e) => handleObservacoesChange(disease.id, e.target.value)}
                          disabled={!studentId}
                        />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
