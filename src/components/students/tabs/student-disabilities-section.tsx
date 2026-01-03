import { Accessibility, Info, Check, X, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useStudentDisabilities } from "@/hooks/use-student-disabilities";

interface StudentDisabilitiesSectionProps {
  studentId?: string;
}

export function StudentDisabilitiesSection({ studentId }: StudentDisabilitiesSectionProps) {
  const {
    disabilityTypes,
    isLoading,
    saveDisability,
    deleteDisability,
    getDisabilityStatus,
    getStats,
  } = useStudentDisabilities(studentId);

  const stats = getStats();

  const handleStatusChange = (disabilityTypeId: string, value: string) => {
    if (!studentId) return;

    if (value === "nao_informado") {
      deleteDisability({ studentId, disabilityTypeId });
    } else {
      saveDisability({
        student_id: studentId,
        disability_type_id: disabilityTypeId,
        possui: value === "sim",
      });
    }
  };

  const getStatusValue = (disabilityTypeId: string): string => {
    const status = getDisabilityStatus(disabilityTypeId);
    if (!status) return "nao_informado";
    return status.possui ? "sim" : "nao";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
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
                <Check className="mr-1 h-3 w-3" />
                {stats.positivas} Sim
              </Badge>
            )}
            {stats.negativas > 0 && (
              <Badge variant="secondary" className="text-xs">
                <X className="mr-1 h-3 w-3" />
                {stats.negativas} Não
              </Badge>
            )}
            {stats.naoInformadas > 0 && (
              <Badge variant="outline" className="text-xs">
                <HelpCircle className="mr-1 h-3 w-3" />
                {stats.naoInformadas} Não informado
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {disabilityTypes.map((disability) => {
            const statusValue = getStatusValue(disability.id);
            
            return (
              <div
                key={disability.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: disability.cor }}
                  />
                  <span className="font-medium">{disability.nome}</span>
                  {disability.informacao_adicional && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 cursor-help text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{disability.informacao_adicional}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <Select
                  value={statusValue}
                  onValueChange={(value) => handleStatusChange(disability.id, value)}
                  disabled={!studentId}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sim">
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-500" />
                        Sim
                      </span>
                    </SelectItem>
                    <SelectItem value="nao">
                      <span className="flex items-center gap-2">
                        <X className="h-4 w-4 text-green-500" />
                        Não
                      </span>
                    </SelectItem>
                    <SelectItem value="nao_informado">
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        -
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
