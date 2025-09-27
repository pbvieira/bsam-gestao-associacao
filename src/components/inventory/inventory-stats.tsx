import { Package, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { StatsCard, StatsGrid } from "@/components/ui/stats-card";
import { InventoryItem } from "@/hooks/use-inventory";

interface InventoryStatsProps {
  items: InventoryItem[];
  totalValue: number;
  lowStockItems: InventoryItem[];
}

export function InventoryStats({ items, totalValue, lowStockItems }: InventoryStatsProps) {
  const totalItems = items.length;
  const lowStockCount = lowStockItems.length;

  return (
    <StatsGrid>
      <StatsCard
        title="Total de Itens"
        value={totalItems}
        icon={Package}
        colorClass="text-primary"
      />
      <StatsCard
        title="Estoque Baixo"
        value={lowStockCount}
        icon={AlertTriangle}
        colorClass="text-warning"
        description={lowStockCount > 0 ? "Requer atenção" : "Todos OK"}
      />
      <StatsCard
        title="Valor Total"
        value={`R$ ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
        icon={TrendingUp}
        colorClass="text-success"
      />
      <StatsCard
        title="Itens Ativos"
        value={items.filter(item => item.ativo).length}
        icon={BarChart3}
        colorClass="text-info"
        description={`${totalItems > 0 ? Math.round((items.filter(item => item.ativo).length / totalItems) * 100) : 0}% do total`}
      />
    </StatsGrid>
  );
}