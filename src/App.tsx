// App Router - Updated 2026-01-22
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { ErrorBoundary } from "@/components/error-boundary";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Tasks from "./pages/Tasks";
import Calendar from "./pages/Calendar";
import Students from "./pages/Students";
import StudentPrint from "./pages/StudentPrint";
import StudentImageAuthorization from "./pages/StudentImageAuthorization";
import StudentVoluntaryIntegration from "./pages/StudentVoluntaryIntegration";
import StudentSocializationParticipation from "./pages/StudentSocializationParticipation";
import StudentResponsibilityTerm from "./pages/StudentResponsibilityTerm";
import Users from "./pages/Users";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
import RoleManagement from "./pages/RoleManagement";
import AnnotationCategories from "./pages/AnnotationCategories";
import InventoryCategories from "./pages/InventoryCategories";
import FiliationStatus from "./pages/FiliationStatus";
import IncomeTypes from "./pages/IncomeTypes";
import BenefitTypes from "./pages/BenefitTypes";
import CashBookEntryCategories from "./pages/CashBookEntryCategories";
import CashBookExitCategories from "./pages/CashBookExitCategories";
import AreasSetores from "./pages/AreasSetores";
import WorkSituations from "./pages/WorkSituations";
import MedicationUsageTypes from "./pages/MedicationUsageTypes";
import VaccineTypes from "./pages/VaccineTypes";
import DiseaseTypes from "./pages/DiseaseTypes";
import DisabilityTypes from "./pages/DisabilityTypes";
import Medications from "./pages/Medications";
import Appointments from "./pages/Appointments";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error && 'status' in error && error.status === 401) {
          return false;
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

const App = () => {
  // Force refresh to clear DynamicRoute cache
  return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster />
          <Sonner />
        <Routes>
          <Route path="/auth" element={
            <UnifiedRoute allowGuests={true}>
              <Auth />
            </UnifiedRoute>
          } />
          <Route path="/" element={
            <UnifiedRoute module="dashboard">
              <Index />
            </UnifiedRoute>
          } />
          <Route path="/tarefas" element={
            <UnifiedRoute module="tasks">
              <Tasks />
            </UnifiedRoute>
          } />
          <Route path="/calendario" element={
            <UnifiedRoute module="calendar">
              <Calendar />
            </UnifiedRoute>
          } />
          <Route path="/alunos" element={
            <UnifiedRoute module="students">
              <Students />
            </UnifiedRoute>
          } />
          <Route path="/alunos/:id/imprimir" element={
            <UnifiedRoute module="students">
              <StudentPrint />
            </UnifiedRoute>
          } />
          <Route path="/alunos/:id/autorizacao-imagem" element={
            <UnifiedRoute module="students">
              <StudentImageAuthorization />
            </UnifiedRoute>
          } />
          <Route path="/alunos/:id/integracao-voluntaria" element={
            <UnifiedRoute module="students">
              <StudentVoluntaryIntegration />
            </UnifiedRoute>
          } />
          <Route path="/alunos/:id/participacao-socializacao" element={
            <UnifiedRoute module="students">
              <StudentSocializationParticipation />
            </UnifiedRoute>
          } />
          <Route path="/alunos/:id/termo-responsabilidade" element={
            <UnifiedRoute module="students">
              <StudentResponsibilityTerm />
            </UnifiedRoute>
          } />
          <Route path="/usuarios" element={
            <UnifiedRoute module="users">
              <Users />
            </UnifiedRoute>
          } />
          <Route path="/estoque" element={
            <UnifiedRoute module="inventory">
              <Inventory />
            </UnifiedRoute>
          } />
          <Route path="/fornecedores" element={
            <UnifiedRoute module="suppliers">
              <Suppliers />
            </UnifiedRoute>
          } />
          <Route path="/compras" element={
            <UnifiedRoute module="purchases">
              <Purchases />
            </UnifiedRoute>
          } />
          <Route path="/relatorios" element={
            <UnifiedRoute module="reports">
              <Reports />
            </UnifiedRoute>
          } />
          <Route path="/gestao-roles" element={
            <UnifiedRoute module="users">
              <RoleManagement />
            </UnifiedRoute>
          } />
          <Route path="/categorias-anotacoes" element={
            <UnifiedRoute module="students">
              <AnnotationCategories />
            </UnifiedRoute>
          } />
          <Route path="/categorias-inventario" element={
            <UnifiedRoute module="inventory">
              <InventoryCategories />
            </UnifiedRoute>
          } />
          <Route path="/estado-filiacao" element={
            <UnifiedRoute module="students">
              <FiliationStatus />
            </UnifiedRoute>
          } />
          <Route path="/tipos-renda" element={
            <UnifiedRoute module="students">
              <IncomeTypes />
            </UnifiedRoute>
          } />
          <Route path="/tipos-beneficio" element={
            <UnifiedRoute module="students">
              <BenefitTypes />
            </UnifiedRoute>
          } />
          <Route path="/categorias-entrada" element={
            <UnifiedRoute module="students">
              <CashBookEntryCategories />
            </UnifiedRoute>
          } />
          <Route path="/categorias-saida" element={
            <UnifiedRoute module="students">
              <CashBookExitCategories />
            </UnifiedRoute>
          } />
          <Route path="/areas-setores" element={
            <UnifiedRoute module="students">
              <AreasSetores />
            </UnifiedRoute>
          } />
          <Route path="/situacoes-trabalhistas" element={
            <UnifiedRoute module="students">
              <WorkSituations />
            </UnifiedRoute>
          } />
          <Route path="/tipos-uso-medicamentos" element={
            <UnifiedRoute module="students">
              <MedicationUsageTypes />
            </UnifiedRoute>
          } />
          <Route path="/tipos-vacinas" element={
            <UnifiedRoute module="students">
              <VaccineTypes />
            </UnifiedRoute>
          } />
          <Route path="/tipos-doencas" element={
            <UnifiedRoute module="students">
              <DiseaseTypes />
            </UnifiedRoute>
          } />
          <Route path="/tipos-deficiencias" element={
            <UnifiedRoute module="students">
              <DisabilityTypes />
            </UnifiedRoute>
          } />
          <Route path="/medicacoes" element={
            <UnifiedRoute module="students">
              <Medications />
            </UnifiedRoute>
          } />
          <Route path="/consultas" element={
            <UnifiedRoute module="students">
              <Appointments />
            </UnifiedRoute>
          } />
          <Route path="/configuracoes" element={
            <UnifiedRoute module="students">
              <Settings />
            </UnifiedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
  );
};

export default App;