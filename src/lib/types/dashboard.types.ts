import type { TransactionDto } from "@/types";

/**
 * Obiekt reprezentujący wybrany okres (miesiąc i rok)
 */
export interface DatePeriod {
  month: number; // 1-12
  year: number; // np. 2025
}

/**
 * Typ wariantu dla karty podsumowania
 */
export type SummaryCardVariant = "income" | "expenses" | "balance";

/**
 * Tryb działania TransactionModal
 */
export type TransactionModalMode = "create" | "edit";

/**
 * Dane formularza transakcji (przed wysłaniem do API)
 */
export interface TransactionFormData {
  amount: number;
  date: string;
  categoryId: string;
  type: "income" | "expense";
  note?: string;
}

/**
 * Stan modalu transakcji
 */
export interface TransactionModalState {
  isOpen: boolean;
  mode: TransactionModalMode;
  transaction?: TransactionDto;
}

/**
 * Stan dialogu usuwania
 */
export interface DeleteDialogState {
  isOpen: boolean;
  transaction?: TransactionDto;
}

/**
 * Dane dla pojedynczego dnia w wykresie
 */
export interface DailyChartDataPoint {
  date: string; // DD
  fullDate: string; // YYYY-MM-DD
  income: number;
  expenses: number;
}

/**
 * Kategoria z licznikiem transakcji (dla select dropdown)
 */
export interface CategoryWithCount {
  id: string;
  name: string;
  transactionCount?: number;
}

// ############################################################################
// # Props dla komponentów Dashboard
// ############################################################################

export interface DashboardContentProps {
  initialMonth: number;
  initialYear: number;
}

export interface DatePeriodNavProps {
  // używa useDatePeriod hook - brak propsów
}

export interface SummaryCardsProps {
  income: number;
  expenses: number;
  balance: number;
  isLoading?: boolean;
}

export interface SummaryCardProps {
  variant: SummaryCardVariant;
  value: number;
  isLoading?: boolean;
}

export interface DailyChartProps {
  data: DailyChartDataPoint[];
  isLoading?: boolean;
}

export interface TransactionsListProps {
  month: number;
  year: number;
  onEditTransaction: (transaction: TransactionDto) => void;
  onDeleteTransaction: (transaction: TransactionDto) => void;
}

export interface TransactionItemProps {
  transaction: TransactionDto;
  onEdit: (transaction: TransactionDto) => void;
  onDelete: (transaction: TransactionDto) => void;
}

export interface TransactionModalProps {
  mode: TransactionModalMode;
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDto;
  defaultDate?: string;
}

export interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionDto;
  onConfirm: (transactionId: string) => Promise<void>;
}

export interface FloatingActionButtonProps {
  onClick: () => void;
}

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: React.ReactNode;
}

