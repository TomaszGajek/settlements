/**
 * Przykładowy test integracyjny - komponent TransactionForm
 */

import { describe, it, expect, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders, userEvent } from "../../utils/test-utils";

// Mock komponent dla przykładu
function TransactionForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    onSubmit({
      amount: Number(formData.get("amount")),
      type: formData.get("type"),
      date: formData.get("date"),
      note: formData.get("note"),
    });
  };

  return (
    <form onSubmit={handleSubmit} aria-label="Transaction form">
      <input type="number" name="amount" placeholder="Kwota" min="0" step="0.01" />
      <select name="type">
        <option value="expense">Wydatek</option>
        <option value="income">Przychód</option>
      </select>
      <input type="date" name="date" />
      <textarea name="note" placeholder="Notatka" />
      <button type="submit">Dodaj</button>
    </form>
  );
}

describe("TransactionForm Integration", () => {
  it("should render all form fields", () => {
    const mockSubmit = vi.fn();
    renderWithProviders(<TransactionForm onSubmit={mockSubmit} />);

    expect(screen.getByPlaceholderText("Kwota")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Notatka")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dodaj/i })).toBeInTheDocument();
  });

  it("should submit form with valid data", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    renderWithProviders(<TransactionForm onSubmit={mockSubmit} />);

    // Wypełnij formularz
    await user.type(screen.getByPlaceholderText("Kwota"), "150.50");
    await user.selectOptions(screen.getByRole("combobox"), "expense");
    await user.type(screen.getByPlaceholderText("Notatka"), "Test note");

    // Wyślij formularz
    await user.click(screen.getByRole("button", { name: /dodaj/i }));

    // Sprawdź czy callback został wywołany
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1);
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 150.5,
          type: "expense",
          note: "Test note",
        })
      );
    });
  });

  it("should handle type selection", async () => {
    const user = userEvent.setup();
    const mockSubmit = vi.fn();
    renderWithProviders(<TransactionForm onSubmit={mockSubmit} />);

    const typeSelect = screen.getByRole("combobox");

    // Domyślnie expense
    expect(typeSelect).toHaveValue("expense");

    // Zmień na income
    await user.selectOptions(typeSelect, "income");
    expect(typeSelect).toHaveValue("income");
  });
});
