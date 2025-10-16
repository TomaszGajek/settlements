import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Calendar, Tag, Receipt } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCategoriesWithCount } from "@/lib/hooks/useCategoriesWithCount";

/**
 * AccountInfoCard component - displays account information and statistics.
 *
 * Features:
 * - User email address
 * - Account creation date
 * - Number of categories
 * - Number of transactions (total)
 *
 * This card is displayed at the top of Settings page to show user
 * which account they are currently logged into.
 */
export const AccountInfoCard: React.FC = () => {
  const { user } = useAuth();
  const { categoriesWithCounts, transactionCounts } = useCategoriesWithCount();

  // Calculate total transactions across all categories
  const totalTransactions = Object.values(transactionCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  // Format account creation date
  const accountCreated = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("pl-PL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Nieznana";

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-100">
          Informacje o koncie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Email */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
            <Mail className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Adres e-mail</p>
            <p className="text-sm font-medium text-gray-100">
              {user?.email || "Nie znaleziono"}
            </p>
          </div>
        </div>

        {/* Account created date */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-800">
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">Data rejestracji</p>
            <p className="text-sm font-medium text-gray-100">{accountCreated}</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="pt-3 border-t border-gray-800">
          <p className="text-xs text-gray-400 mb-3">Statystyki</p>
          <div className="flex gap-4">
            {/* Categories count */}
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Kategorie</p>
                <Badge variant="secondary" className="mt-1">
                  {categoriesWithCounts.length}
                </Badge>
              </div>
            </div>

            {/* Transactions count */}
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Transakcje</p>
                <Badge variant="secondary" className="mt-1">
                  {totalTransactions}
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

