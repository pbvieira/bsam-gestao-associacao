import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useStudentEmergencyContacts } from '@/hooks/use-student-emergency-contacts';
import { useToast } from '@/hooks/use-toast';
import { ContactDialog } from './contact-dialog';
import { Loader2, Phone, MapPin, Edit, Trash2, Plus } from 'lucide-react';

interface StudentContactsTabProps {
  studentId?: string;
}

export function StudentContactsTab({ studentId }: StudentContactsTabProps) {
  const { contacts, loading, createContact, updateContact, deleteContact } = useStudentEmergencyContacts(studentId);
  const { toast } = useToast();

  const handleCreateContact = async (contactData: any) => {
    const result = await createContact(contactData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleUpdateContact = async (contactData: any, contactId: string) => {
    const result = await updateContact(contactId, contactData);
    if (result?.error) {
      throw new Error(result.error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const result = await deleteContact(contactId);
    if (result?.error) {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Sucesso',
        description: 'Contato removido com sucesso!',
      });
    }
  };

  if (!studentId) {
    return (
      <Card>
        <CardContent className="text-center py-8 text-muted-foreground">
          <p>Selecione um aluno para gerenciar contatos de emergência</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando contatos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Contatos de Emergência</CardTitle>
        <ContactDialog onSave={handleCreateContact} />
      </CardHeader>
      <CardContent>
        {contacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">Nenhum contato cadastrado</p>
            <p className="text-sm mb-4">Adicione contatos de emergência para este aluno</p>
            <ContactDialog 
              onSave={handleCreateContact}
              trigger={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Primeiro Contato
                </Button>
              }
            />
          </div>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{contact.nome}</h3>
                      {contact.avisar_contato && (
                        <Badge variant="secondary" className="text-xs">
                          Avisar em emergências
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{contact.telefone}</span>
                      </div>
                      
                      {contact.parentesco && (
                        <div className="flex items-center gap-2">
                          <span className="h-4 w-4 text-center text-xs font-bold">P</span>
                          <span>{contact.parentesco}</span>
                        </div>
                      )}
                      
                      {contact.endereco && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{contact.endereco}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <ContactDialog 
                      contact={contact}
                      onSave={(data) => handleUpdateContact(data, contact.id)}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover contato</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover o contato de {contact.nome}? 
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteContact(contact.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remover
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}