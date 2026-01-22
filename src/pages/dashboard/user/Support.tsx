import { useMemo, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function getDisplayName(user: any): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, any>;
  const fromMeta = String(meta?.name ?? "").trim();
  const first = String(meta?.first_name ?? "").trim();
  const last = String(meta?.last_name ?? "").trim();
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return fromMeta || combined || String(user?.email ?? "").split("@")[0] || "";
}

export default function UserSupport() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const name = useMemo(() => getDisplayName(user), [user]);
  const email = useMemo(() => String(user?.email ?? ""), [user]);

  const canSubmit = subject.trim().length > 0 && message.trim().length > 0 && !submitting;

  const submit = async () => {
    if (!user) return;
    if (!canSubmit) return;

    try {
      setSubmitting(true);

      const { error } = await (supabase as any).from("website_inquiries").insert({
        name: name || "User",
        email: email || "unknown",
        subject: subject.trim(),
        message: message.trim(),
        status: "new",
        source: "business_support",
      });

      if (error) throw error;

      setSubject("");
      setMessage("");
      toast({ title: "Sent", description: "Your support request has been submitted." });
    } catch (e) {
      console.error("Support submit error:", e);
      toast({
        title: "Failed",
        description: "Could not submit your request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">Support</h1>
        <p className="text-sm text-muted-foreground">Send a message to the team. We'll get back to you by email.</p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">New Support Request</CardTitle>
          <CardDescription>Provide a clear subject and include as much detail as possible.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} disabled />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} disabled />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., I can't access my dashboard"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe the issue, steps to reproduce, and any relevant details."
              rows={7}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={submit} disabled={!canSubmit}>
              {submitting ? "Sending..." : "Send"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
