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
import Users from "./pages/Users";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Reports from "./pages/Reports";
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

const App = () => (
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
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;