import React from "react";
import { QueryProvider } from "@/components/shared/QueryProvider";
import { AuthProvider } from "@/lib/hooks/useAuth";
import { Header } from "@/components/shared/Header";
import { SettingsContent } from "./SettingsContent";

/**
 * SettingsApp - wrapper component that provides all necessary contexts.
 *
 * This component wraps SettingsContent with:
 * - AuthProvider for authentication state
 * - QueryProvider for React Query
 * - Header with navigation
 */
export const SettingsApp: React.FC = () => {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-950">
        <Header currentPage="settings" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-100">Ustawienia</h1>
            <p className="text-gray-400 mt-2">Zarządzaj kategoriami transakcji i ustawieniami konta.</p>
          </div>

          {/* Settings content */}
          <QueryProvider>
            <SettingsContent />
          </QueryProvider>
        </main>
      </div>
    </AuthProvider>
  );
};
