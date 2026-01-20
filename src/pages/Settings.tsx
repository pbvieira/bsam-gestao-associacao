import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Link } from 'react-router-dom';
import { 
  Tag, 
  Users, 
  Wallet, 
  Gift, 
  TrendingUp, 
  TrendingDown, 
  Building2, 
  Briefcase, 
  Pill, 
  Syringe, 
  HeartPulse, 
  Accessibility,
  Table2,
  Shield,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingItem {
  name: string;
  href: string;
  icon: LucideIcon;
  module: string;
  description?: string;
}

interface SettingsCategory {
  title: string;
  description: string;
  icon: LucideIcon;
  items: SettingItem[];
}

const settingsCategories: SettingsCategory[] = [
  {
    title: "Tabelas Auxiliares",
    description: "Gerencie os cadastros auxiliares do sistema",
    icon: Table2,
    items: [
      { name: "Categorias de Anotações", href: "/categorias-anotacoes", icon: Tag, module: "students", description: "Categorias para anotações de alunos" },
      { name: "Categorias de Inventário", href: "/categorias-inventario", icon: Tag, module: "inventory", description: "Categorias para itens do estoque" },
      { name: "Estado Filiação", href: "/estado-filiacao", icon: Users, module: "students", description: "Status de filiação parental" },
      { name: "Tipos de Renda", href: "/tipos-renda", icon: Wallet, module: "students", description: "Tipos de fonte de renda" },
      { name: "Tipos de Benefício", href: "/tipos-beneficio", icon: Gift, module: "students", description: "Tipos de benefícios sociais" },
      { name: "Categorias de Entrada", href: "/categorias-entrada", icon: TrendingUp, module: "students", description: "Categorias de entrada financeira" },
      { name: "Categorias de Saída", href: "/categorias-saida", icon: TrendingDown, module: "students", description: "Categorias de saída financeira" },
      { name: "Áreas e Setores", href: "/areas-setores", icon: Building2, module: "students", description: "Estrutura organizacional" },
      { name: "Situações Trabalhistas", href: "/situacoes-trabalhistas", icon: Briefcase, module: "students", description: "Status de trabalho" },
      { name: "Tipos de Uso Medicamentos", href: "/tipos-uso-medicamentos", icon: Pill, module: "students", description: "Formas de administração" },
      { name: "Tipos de Vacinas", href: "/tipos-vacinas", icon: Syringe, module: "students", description: "Cadastro de vacinas" },
      { name: "Tipos de Doenças", href: "/tipos-doencas", icon: HeartPulse, module: "students", description: "Cadastro de doenças" },
      { name: "Tipos de Deficiências", href: "/tipos-deficiencias", icon: Accessibility, module: "students", description: "Tipos de deficiência" },
    ]
  },
  {
    title: "Permissões e Acessos",
    description: "Gerencie os acessos e permissões do sistema",
    icon: Shield,
    items: [
      { name: "Gestão de Permissões", href: "/gestao-roles", icon: Shield, module: "users", description: "Permissões por perfil de usuário" },
    ]
  }
];

export default function Settings() {
  const { canAccess } = useAuth();

  return (
    <MainLayout>
      <PageLayout 
        title="Configurações" 
        subtitle="Gerencie as configurações e tabelas auxiliares do sistema"
      >
        <div className="space-y-8">
          {settingsCategories.map((category) => {
            const CategoryIcon = category.icon;
            const filteredItems = category.items.filter(item => canAccess(item.module));
            
            if (filteredItems.length === 0) return null;

            return (
              <section key={category.title} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <CategoryIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{category.title}</h2>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredItems.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <Link key={item.href} to={item.href}>
                        <Card className={cn(
                          "h-full transition-all duration-200 hover:shadow-md hover:border-primary/50",
                          "cursor-pointer group"
                        )}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                                <ItemIcon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                              <CardTitle className="text-sm font-medium group-hover:text-primary transition-colors">
                                {item.name}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          {item.description && (
                            <CardContent className="pt-0">
                              <CardDescription className="text-xs">
                                {item.description}
                              </CardDescription>
                            </CardContent>
                          )}
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </PageLayout>
    </MainLayout>
  );
}
