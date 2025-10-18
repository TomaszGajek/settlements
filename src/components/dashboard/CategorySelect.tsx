import React, { useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/lib/hooks/useCategories";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

export interface CategorySelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

/**
 * CategorySelect component with searchable dropdown.
 *
 * Features:
 * - Loads categories from API using useCategories hook
 * - Alphabetical sorting with "Inne" always at the end
 * - Loading state during fetch
 * - Empty state when no categories exist
 * - Keyboard navigation: Arrow up/down, Enter, Escape
 * - Type-to-search functionality (built into Select component)
 *
 * @param value - Current category ID
 * @param onChange - Callback when category changes
 * @param error - Error message to display
 * @param disabled - Whether the select is disabled
 */
export const CategorySelect: React.FC<CategorySelectProps> = ({ value, onChange, error, disabled = false }) => {
  const { data: categories, isLoading, isError } = useCategories();

  // Sort categories: alphabetically, with "Inne" at the end
  const sortedCategories = useMemo(() => {
    if (!categories) return [];

    const others = categories.filter((c) => c.name.toLowerCase() === "inne");
    const rest = categories
      .filter((c) => c.name.toLowerCase() !== "inne")
      .sort((a, b) => a.name.localeCompare(b.name, "pl"));

    return [...rest, ...others];
  }, [categories]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Ładowanie kategorii...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Nie udało się pobrać kategorii. Spróbuj odświeżyć stronę.</AlertDescription>
      </Alert>
    );
  }

  if (categories?.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          Nie masz jeszcze żadnych kategorii. Aby dodać transakcję, najpierw utwórz kategorię w ustawieniach.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        data-testid="transaction-category-select"
        aria-label="Kategoria transakcji"
        aria-required="true"
        aria-invalid={!!error}
        aria-describedby={error ? "category-error" : undefined}
        className={error ? "border-red-500" : ""}
      >
        <SelectValue placeholder="Wybierz kategorię" />
      </SelectTrigger>
      <SelectContent>
        {sortedCategories.map((category) => (
          <SelectItem key={category.id} value={category.id} data-testid={`category-option-${category.id}`}>
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
