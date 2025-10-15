import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface NoteTextareaProps {
  value: string | null | undefined;
  onChange: (value: string | null) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
}

/**
 * NoteTextarea component with character counter.
 *
 * Features:
 * - Character counter display (current/max)
 * - Warning color when approaching limit (>90%)
 * - Visual feedback for remaining characters
 * - Handles null/undefined values gracefully
 * - Accessible with proper ARIA attributes
 *
 * @param value - Current note value
 * @param onChange - Callback when note changes
 * @param error - Error message to display
 * @param disabled - Whether the textarea is disabled
 * @param maxLength - Maximum character limit (default: 500)
 */
export const NoteTextarea: React.FC<NoteTextareaProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  maxLength = 500,
}) => {
  const currentLength = value?.length || 0;
  const isNearLimit = currentLength > maxLength * 0.9; // >450 chars for default 500

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    // Convert empty string to null
    onChange(newValue === "" ? null : newValue);
  };

  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Dodaj notatkę do transakcji... (opcjonalnie)"
        className={cn("resize-none min-h-[100px]", error && "border-red-500")}
        value={value || ""}
        onChange={handleChange}
        disabled={disabled}
        maxLength={maxLength}
        aria-label="Notatka do transakcji"
        aria-invalid={!!error}
        aria-describedby={error ? "note-error" : "note-counter"}
      />
      <div className="flex items-center justify-end">
        <span
          id="note-counter"
          className={cn(
            "text-sm transition-colors",
            isNearLimit ? "text-yellow-500 font-medium" : "text-muted-foreground",
            currentLength >= maxLength && "text-red-500 font-medium"
          )}
          aria-live="polite"
        >
          {currentLength}/{maxLength}
        </span>
      </div>
    </div>
  );
};

