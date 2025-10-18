import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { toast } from "sonner";

interface HeaderProps {
  currentPage: "dashboard" | "settings";
}

/**
 * Header component with navigation and user actions.
 *
 * Features:
 * - Logo and brand name
 * - Navigation links (Dashboard, Settings)
 * - Active state highlighting
 * - Logout button with authentication integration
 * - Sticky positioning at top
 *
 * @param currentPage - Current active page for highlighting nav item
 */
export const Header: React.FC<HeaderProps> = ({ currentPage }) => {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Wylogowano pomyślnie");
      window.location.href = "/";
    } catch (error) {
      toast.error("Nie udało się wylogować");
      console.error("Logout error:", error);
    }
  };

  return (
    <header className="border-b border-gray-800 bg-gray-900 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Brand */}
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-100">Settlements</h1>
            <span className="text-gray-600">|</span>
            <nav className="flex space-x-1">
              <a
                href="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "dashboard"
                    ? "bg-gray-800 text-gray-100"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
                aria-current={currentPage === "dashboard" ? "page" : undefined}
              >
                Dashboard
              </a>
              <a
                href="/settings"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentPage === "settings"
                    ? "bg-gray-800 text-gray-100"
                    : "text-gray-400 hover:text-gray-100 hover:bg-gray-800"
                }`}
                aria-current={currentPage === "settings" ? "page" : undefined}
              >
                Ustawienia
              </a>
            </nav>
          </div>

          {/* User actions */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" onClick={handleLogout} size="sm">
              Wyloguj
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
