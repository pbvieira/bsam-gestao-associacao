import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";

import { StudentList } from "@/components/students/student-list";
import { StudentForm } from "@/components/students/student-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Loader2 } from "lucide-react";
import { useStudentPhoto } from "@/hooks/use-student-photo";

type ViewMode = 'list' | 'create' | 'edit' | 'view';

export default function Students() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  
  // Hook para foto do aluno - usado em modos de edição/visualização
  const { photoUrl, loading: photoLoading, refreshPhoto } = useStudentPhoto(
    viewMode === 'edit' || viewMode === 'view' ? selectedStudent?.id : undefined
  );

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setViewMode('create');
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setViewMode('edit');
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setViewMode('view');
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedStudent(null);
  };

  return (
    <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            {viewMode !== 'list' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToList}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            )}
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {viewMode === 'list' && 'Alunos'}
                {viewMode === 'create' && 'Novo Aluno'}
                {viewMode === 'edit' && `Editar: ${selectedStudent?.nome_completo}`}
                {viewMode === 'view' && `Visualizar: ${selectedStudent?.nome_completo}`}
              </h1>
              <p className="text-muted-foreground">
                {viewMode === 'list' && 'Gestão completa dos assistidos da associação'}
                {viewMode === 'create' && 'Cadastre um novo assistido da associação'}
                {viewMode === 'edit' && 'Edite as informações do assistido'}
                {viewMode === 'view' && 'Visualização somente leitura do cadastro'}
              </p>
            </div>
            
            {/* Foto do Aluno - exibida no header no modo edição/visualização */}
            {(viewMode === 'edit' || viewMode === 'view') && (
              <div className="w-20 h-20 rounded-lg border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {photoLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt="Foto do aluno" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-muted-foreground" />
                )}
              </div>
            )}
          </div>
          
          {viewMode === 'list' && (
            <StudentList 
              onCreateStudent={handleCreateStudent}
              onEditStudent={handleEditStudent}
              onViewStudent={handleViewStudent}
            />
          )}
          
          {(viewMode === 'create' || viewMode === 'edit' || viewMode === 'view') && (
            <StudentForm 
              student={selectedStudent}
              onSuccess={handleBackToList}
              onCancel={handleBackToList}
              onRefreshPhoto={refreshPhoto}
              readOnly={viewMode === 'view'}
            />
          )}
        </div>
      </MainLayout>
  );
}