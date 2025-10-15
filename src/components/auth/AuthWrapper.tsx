import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";

interface AuthWrapperProps {
  defaultTab?: string;
  defaultEmail?: string;
}

/**
 * Wrapper component for authentication tabs
 * This ensures all Radix UI Tabs components are in the same React tree
 */
export function AuthWrapper({ defaultTab = "login", defaultEmail }: AuthWrapperProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="login">Logowanie</TabsTrigger>
        <TabsTrigger value="register">Rejestracja</TabsTrigger>
      </TabsList>

      <TabsContent value="login" className="mt-4">
        <LoginForm defaultEmail={defaultEmail} />
      </TabsContent>

      <TabsContent value="register" className="mt-4">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
}

