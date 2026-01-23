import { ContactMessageForm } from "@/components/contact/ContactMessageForm";

type Props = {
  name: string;
  email: string;
};

export default function AssistSupportLocked({ name, email }: Props) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-4">
        <header className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="text-sm text-muted-foreground">
            Akun kamu sedang <span className="font-medium">Nonactive</span>. Silakan kirim pesan ke admin untuk
            aktivasi.
          </p>
        </header>

        <ContactMessageForm
          source="assistant_support"
          disableNameEmail
          defaultValues={{ name, email, subject: "Request activation" }}
          wrapper="card"
        />
      </div>
    </div>
  );
}
