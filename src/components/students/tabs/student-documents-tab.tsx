import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStudentDocuments } from '@/hooks/use-student-documents';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, Trash2, FileText, Image, Video, File } from 'lucide-react';

interface StudentDocumentsTabProps {
  studentId?: string;
}

export function StudentDocumentsTab({ studentId }: StudentDocumentsTabProps) {
  const { documents, loading, uploadDocument, downloadDocument, deleteDocument } = useStudentDocuments(studentId);
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCategory) {
      toast({
        title: 'Erro',
        description: 'Selecione um arquivo e uma categoria.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadDocument(file, selectedCategory);
      if (result?.error) {
        throw new Error(result.error);
      }
      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso!',
      });
      setSelectedCategory('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao enviar documento.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const getFileIcon = (mimeType: string | null) => {
    if (!mimeType) return <File className="h-5 w-5" />;
    if (mimeType.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (mimeType.startsWith('video/')) return <Video className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };


  if (!studentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documentos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Salve o aluno primeiro</p>
            <p className="text-sm">
              Para fazer upload de documentos, primeiro salve os dados básicos do aluno.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Upload Section */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 mb-6">
          <div className="text-center space-y-4">
            <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Upload de Documentos</h3>
              <p className="text-sm text-muted-foreground">Selecione a categoria e o arquivo</p>
            </div>
            
            <div className="flex gap-4 justify-center items-end">
              <div className="w-48">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="foto_aluno">Foto do Aluno</SelectItem>
                    <SelectItem value="documentos_pessoais">Documentos Pessoais</SelectItem>
                    <SelectItem value="comprovantes">Comprovantes</SelectItem>
                    <SelectItem value="laudos">Laudos</SelectItem>
                    <SelectItem value="fotos">Fotos</SelectItem>
                    <SelectItem value="videos">Vídeos</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="*/*"
                />
                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || !selectedCategory}
                >
                  {isUploading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Selecionar Arquivo
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Carregando documentos...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum documento encontrado</p>
            <p className="text-sm">Faça upload dos primeiros documentos para este aluno</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getFileIcon(document.mime_type)}
                  <div>
                    <p className="font-medium">{document.nome_arquivo}</p>
                    <div className="flex gap-2 text-sm text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {document.tipo_documento.replace('_', ' ')}
                      </Badge>
                      <span>{formatFileSize(document.tamanho_arquivo)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadDocument(document)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteDocument(document)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}