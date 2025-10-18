import { Check, X } from "lucide-react";
import type { PasswordRequirementsProps } from "@/lib/types/auth.types";

/**
 * Komponent wyświetlający checklist wymagań hasła
 */
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements = [
    {
      label: "Minimum 6 znaków",
      met: password.length >= 6,
    },
  ];

  if (password.length === 0) {
    return null;
  }

  return (
    <ul className="mt-2 space-y-1 text-sm">
      {requirements.map((req, index) => (
        <li key={index} className="flex items-center gap-2">
          {req.met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
          <span className={req.met ? "text-green-500" : "text-red-500"}>{req.label}</span>
        </li>
      ))}
    </ul>
  );
}
