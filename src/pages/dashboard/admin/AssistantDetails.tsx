import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, User } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

type ProfileRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  country: string | null;
  city: string | null;
  skills: string[] | null;
};

const formatAssistId = (userId: string) => {
  const idNum = (parseInt(userId.slice(-4), 16) % 900) + 100;
  return `A${String(idNum).padStart(5, "0")}`;
};

export default function AdminAssistantDetails() {
  const navigate = useNavigate();
  const { userId } = useParams();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileRow | null>(null);

  const assistId = useMemo(() => (userId ? formatAssistId(userId) : ""), [userId]);

  useEffect(() => {
    if (!userId) return;

    (async () => {
      setLoading(true);
      try {
        const { data, error } = await (supabase as any)
          .from("profiles")
          .select("id, name, email, phone, avatar_url, country, city, skills")
          .eq("id", userId)
          .maybeSingle();

        if (error) throw error;
        setProfile((data as ProfileRow) ?? null);
      } catch (e) {
        console.error("Error fetching assistant profile:", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  if (!userId) return null;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/admin/assistants")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Assistant Profile</h1>
          <p className="text-sm text-muted-foreground">View assistant account profile details.</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Read-only view for admin.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="py-8 text-sm text-muted-foreground">Loading profile...</div>
          ) : !profile ? (
            <div className="py-8 text-sm text-muted-foreground">Profile not found.</div>
          ) : (
            <>
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name ? `${profile.name} avatar` : "Assistant avatar"} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {(profile.name ?? "A").charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-semibold text-foreground truncate">{profile.name ?? "—"}</h2>
                    <Badge variant="secondary" className="font-mono">{assistId}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{profile.email}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground">Phone</div>
                  <div className="mt-1 text-sm font-medium text-foreground">{profile.phone ?? "—"}</div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">
                    {[profile.city, profile.country].filter(Boolean).join(", ") || "—"}
                  </div>
                </div>
              </div>

              {Array.isArray(profile.skills) && profile.skills.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Skills</div>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
