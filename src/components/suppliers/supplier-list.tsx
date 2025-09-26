import { useState } from "react";
import { useSuppliers } from "@/hooks/use-suppliers";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, UserX, Building2, Phone, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SupplierListProps {
  onCreateSupplier: () => void;
  onEditSupplier: (supplier: any) => void;
}

export function SupplierList({ onCreateSupplier, onEditSupplier }: SupplierListProps) {
  const { suppliers, loading, deactivateSupplier } = useSuppliers();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("razao_social");

  const handleDeactivate = async (supplier: any) => {
    if (window.confirm(`Tem certeza que deseja desativar o fornecedor "${supplier.razao_social}"?`)) {
      const { error } = await deactivateSupplier(supplier.id);
      if (error) {
        toast({
          title: "Erro",
          description: error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sucesso",
          description: "Fornecedor desativado com sucesso",
        });
      }
    }
  };

  const filteredSuppliers = suppliers
    .filter(supplier => {
      const matchesSearch = 
        supplier.razao_social.toLowerCase().includes(search.toLowerCase()) ||
        supplier.nome_fantasia?.toLowerCase().includes(search.toLowerCase()) ||
        supplier.cnpj?.includes(search) ||
        supplier.cpf?.includes(search);
      
      const matchesType = typeFilter === "all" || supplier.tipo === typeFilter;
      
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "razao_social":
          return a.razao_social.localeCompare(b.razao_social);
        case "tipo":
          return a.tipo.localeCompare(b.tipo);
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const stats = [
    {
      title: "Total Fornecedores",
      value: suppliers.length,
      description: "Fornecedores cadastrados",
      icon: Building2,
    },
    {
      title: "Pessoa Jurídica",
      value: suppliers.filter(s => s.tipo === "juridica").length,
      description: "Empresas",
      icon: Building2,
    },
    {
      title: "Pessoa Física",
      value: suppliers.filter(s => s.tipo === "fisica").length,
      description: "Pessoas físicas",
      icon: Building2,
    },
    {
      title: "Resultados",
      value: filteredSuppliers.length,
      description: "Na busca atual",
      icon: Search,
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores</CardTitle>
          <CardDescription>
            Gerencie os fornecedores da sua organização
          </CardDescription>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por razão social, nome fantasia, CNPJ/CPF..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
                <SelectItem value="fisica">Pessoa Física</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="razao_social">Razão Social</SelectItem>
                <SelectItem value="tipo">Tipo</SelectItem>
                <SelectItem value="created_at">Data de Cadastro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {search || typeFilter !== "all" ? "Nenhum resultado encontrado" : "Nenhum fornecedor cadastrado"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {search || typeFilter !== "all" 
                  ? "Tente ajustar os filtros de busca" 
                  : "Comece cadastrando seu primeiro fornecedor"
                }
              </p>
              {(!search && typeFilter === "all") && (
                <Button onClick={onCreateSupplier}>
                  Cadastrar Primeiro Fornecedor
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Razão Social</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.razao_social}</div>
                        {supplier.nome_fantasia && (
                          <div className="text-sm text-muted-foreground">
                            {supplier.nome_fantasia}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.tipo === "juridica" ? "default" : "secondary"}>
                        {supplier.tipo === "juridica" ? "PJ" : "PF"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {supplier.cnpj || supplier.cpf || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {supplier.telefone && (
                          <div className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3" />
                            {supplier.telefone}
                          </div>
                        )}
                        {supplier.email && (
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3" />
                            {supplier.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={supplier.ativo ? "default" : "secondary"}>
                        {supplier.ativo ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditSupplier(supplier)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {supplier.ativo && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivate(supplier)}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}