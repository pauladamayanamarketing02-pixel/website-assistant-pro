import { ContactMessageForm } from "@/components/contact/ContactMessageForm";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

type Props = {
  name: string;
  email: string;
  onLogout: () => void;
};

export default function AssistSupportLocked({ name, email, onLogout }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">
            Your account is currently <span className="font-medium">Nonactive</span>. Please send a message to the
            admin to request activation.
          </p>
        </header>

        <ContactMessageForm
          source="assistant_support"
          disableNameEmail
          defaultValues={{ name, email, subject: "Request activation" }}
          wrapper="card"
        />

        <Button variant="outline" className="w-full" onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
}
