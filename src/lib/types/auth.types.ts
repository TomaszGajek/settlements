import type { User, Session } from "@supabase/supabase-js";

/**
 * Dane formularza logowania
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Dane formularza rejestracji
 */
export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Dane formularza resetowania hasła
 */
export interface ResetPasswordFormData {
  email: string;
}

/**
 * Dane formularza zmiany hasła (po kliknięciu w link z emaila)
 */
export interface UpdatePasswordFormData {
  password: string;
  confirmPassword: string;
}

/**
 * Typ błędów autentykacji
 */
export type AuthErrorType =
  | "invalid_credentials"
  | "email_already_exists"
  | "weak_password"
  | "invalid_email"
  | "network_error"
  | "unknown_error";

/**
 * Obiekt błędu autentykacji
 */
export interface AuthError {
  type: AuthErrorType;
  message: string;
}

/**
 * Stan autentykacji
 */
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: AuthError | null;
}

/**
 * Props komponentu LoginForm
 */
export interface LoginFormProps {
  defaultEmail?: string;
  onSuccess?: () => void;
}

/**
 * Props komponentu RegisterForm
 */
export interface RegisterFormProps {
  onSuccess?: () => void;
}

/**
 * Props komponentu ResetPasswordForm
 */
export interface ResetPasswordFormProps {
  defaultEmail?: string;
}

/**
 * Props komponentu UpdatePasswordForm
 */
export interface UpdatePasswordFormProps {
  onSuccess?: () => void;
}

/**
 * Props komponentu PasswordInput
 */
export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showRequirements?: boolean;
  value?: string;
}

/**
 * Props komponentu PasswordRequirements
 */
export interface PasswordRequirementsProps {
  password: string;
}

/**
 * Props komponentu AuthErrorDisplay
 */
export interface AuthErrorDisplayProps {
  error: string | null;
  onDismiss?: () => void;
}

// Re-export Supabase types for convenience
export type { User, Session };
