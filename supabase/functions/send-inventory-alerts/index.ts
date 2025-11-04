import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertRequest {
  user_id: string;
  low_stock_count: number;
  out_of_stock_count: number;
  pending_purchases_count: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, low_stock_count, out_of_stock_count, pending_purchases_count }: AlertRequest = await req.json();

    console.log("Processing inventory alerts for user:", user_id);

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email and profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, user_id")
      .eq("user_id", user_id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      throw new Error("Failed to fetch user profile");
    }

    // Get user email from auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id);

    if (userError || !userData.user?.email) {
      console.error("Error fetching user email:", userError);
      throw new Error("Failed to fetch user email");
    }

    const userEmail = userData.user.email;
    const userName = profile?.full_name || "Usuário";

    // Get detailed low stock items
    const { data: lowStockItems, error: stockError } = await supabase
      .from("inventory_items")
      .select("nome, estoque_atual, estoque_minimo, categoria")
      .eq("ativo", true)
      .lte("estoque_atual", supabase.raw("estoque_minimo"))
      .order("estoque_atual", { ascending: true })
      .limit(10);

    if (stockError) {
      console.error("Error fetching stock items:", stockError);
    }

    // Get pending purchases
    const { data: pendingPurchases, error: purchasesError } = await supabase
      .from("purchase_orders")
      .select(`
        codigo_pedido,
        data_pedido,
        valor_total,
        suppliers(razao_social)
      `)
      .eq("status", "pendente")
      .order("data_pedido", { ascending: true })
      .limit(5);

    if (purchasesError) {
      console.error("Error fetching purchases:", purchasesError);
    }

    // Build email HTML
    let stockItemsHtml = '';
    if (lowStockItems && lowStockItems.length > 0) {
      stockItemsHtml = `
        <h3 style="color: #dc2626; margin-top: 20px;">Itens com Estoque Crítico:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Item</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Categoria</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">Atual</th>
              <th style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">Mínimo</th>
            </tr>
          </thead>
          <tbody>
            ${lowStockItems.map(item => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.nome}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${item.categoria || '-'}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb; ${item.estoque_atual === 0 ? 'color: #dc2626; font-weight: bold;' : ''}">${item.estoque_atual}</td>
                <td style="padding: 8px; text-align: center; border: 1px solid #e5e7eb;">${item.estoque_minimo}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    let purchasesHtml = '';
    if (pendingPurchases && pendingPurchases.length > 0) {
      purchasesHtml = `
        <h3 style="color: #2563eb; margin-top: 20px;">Pedidos Aguardando Aprovação:</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Código</th>
              <th style="padding: 8px; text-align: left; border: 1px solid #e5e7eb;">Fornecedor</th>
              <th style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${pendingPurchases.map((purchase: any) => `
              <tr>
                <td style="padding: 8px; border: 1px solid #e5e7eb; font-family: monospace;">${purchase.codigo_pedido}</td>
                <td style="padding: 8px; border: 1px solid #e5e7eb;">${purchase.suppliers?.razao_social || '-'}</td>
                <td style="padding: 8px; text-align: right; border: 1px solid #e5e7eb;">R$ ${purchase.valor_total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }

    // Send email
    const emailResponse = await resend.emails.send({
      from: "Sistema de Gestão <onboarding@resend.dev>",
      to: [userEmail],
      subject: `⚠️ Alertas de Inventário - ${out_of_stock_count + low_stock_count} itens requerem atenção`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1f2937; border-bottom: 2px solid #6366f1; padding-bottom: 10px;">
            Resumo de Alertas do Inventário
          </h1>
          
          <p>Olá, ${userName}!</p>
          
          <p>Aqui está um resumo dos alertas ativos no seu sistema de gestão:</p>
          
          <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <strong style="color: #dc2626;">🚨 Estoque Zerado:</strong> ${out_of_stock_count} ${out_of_stock_count === 1 ? 'item' : 'itens'}
          </div>
          
          <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong style="color: #f59e0b;">⚠️ Estoque Baixo:</strong> ${low_stock_count - out_of_stock_count} ${(low_stock_count - out_of_stock_count) === 1 ? 'item' : 'itens'}
          </div>
          
          ${pending_purchases_count > 0 ? `
            <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0;">
              <strong style="color: #2563eb;">📋 Pedidos Pendentes:</strong> ${pending_purchases_count} ${pending_purchases_count === 1 ? 'pedido aguarda' : 'pedidos aguardam'} aprovação
            </div>
          ` : ''}
          
          ${stockItemsHtml}
          ${purchasesHtml}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; font-size: 14px;">
              Este é um alerta automático do sistema de gestão. Acesse o sistema para tomar as ações necessárias.
            </p>
          </div>
        </div>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    // Create notification in the system
    await supabase.from("notifications").insert({
      user_id: user_id,
      type: "inventory_alert",
      title: "Alertas de Inventário",
      message: `${out_of_stock_count} itens zerados, ${low_stock_count - out_of_stock_count} itens com estoque baixo${pending_purchases_count > 0 ? `, ${pending_purchases_count} pedidos pendentes` : ''}`,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Alerts sent successfully",
        email_sent: true 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-inventory-alerts function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
