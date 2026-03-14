import { Accessibility, Info, Check, X, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useStudentDisabilities } from "@/hooks/use-student-disabilities";

interface StudentDisabilitiesSectionProps {
  studentId?: string;
}

export function StudentDisabilitiesSection({ studentId }: StudentDisabilitiesSectionProps) {
  const { disabilityTypes, isLoading, saveDisability, deleteDisability, getDisabilityStatus, getStats } = useStudentDisabilities(studentId);
  const stats = getStats();

  const handleStatusChange = (disabilityTypeId: string, value: string) => {
    if (!studentId) return;
    if (value === "nao_informado") {
      deleteDisability({ studentId, disabilityTypeId });
    } else {
      const existing = getDisabilityStatus(disabilityTypeId);
      saveDisability({
        student_id: studentId,
        disability_type_id: disabilityTypeId,
        possui: value === "sim",
        observacoes: value === "sim" ? (existing?.observacoes ?? null) : null,
      });
    }
  };

  const handleObservacoesChange = (disabilityTypeId: string, observacoes: string) => {
    if (!studentId) return;
    saveDisability({
      student_id: studentId,
      disability_type_id: disabilityTypeId,
      possui: true,
      observacoes: observacoes || null,
    });
  };

  const getStatusValue = (disabilityTypeId: string): string => {
    const status = getDisabilityStatus(disabilityTypeId);
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

  if (disabilityTypes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Accessibility className="h-5 w-5" />
            Deficiências
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Nenhum tipo de deficiência cadastrado. Configure os tipos em Tabelas Auxiliares.
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
            <Accessibility className="h-5 w-5" />
            Deficiências
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
                <TableHead>Deficiência</TableHead>
                <TableHead className="w-[140px]">Status</TableHead>
                <TableHead>Observações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {disabilityTypes.map((disability) => {
                const statusValue = getStatusValue(disability.id);
                const disabilityStatus = getDisabilityStatus(disability.id);
                return (
                  <TableRow key={disability.id}>
                    <TableCell className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: disability.cor }} />
                        <span className="text-sm font-medium">{disability.nome}</span>
                        {disability.informacao_adicional && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 cursor-help text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{disability.informacao_adicional}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-2">
                      <Select value={statusValue} onValueChange={(v) => handleStatusChange(disability.id, v)} disabled={!studentId}>
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim">
                            <span className="flex items-center gap-2"><Check className="h-3 w-3 text-purple-500" /> Sim</span>
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
                          defaultValue={disabilityStatus?.observacoes ?? ""}
                          onBlur={(e) => handleObservacoesChange(disability.id, e.target.value)}
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
