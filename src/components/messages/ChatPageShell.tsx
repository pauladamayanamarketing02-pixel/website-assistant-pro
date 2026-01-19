import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export type ChatContactUI = {
  id: string;
  title: string;
  subtitle?: string | null;
  avatarUrl?: string | null;
  unreadCount?: number;
  lastPreview?: string | null;
};

type Props = {
  pageTitle: string;
  pageSubtitle?: string;

  searchPlaceholder: string;
  searchQuery: string;
  onSearchQueryChange: (v: string) => void;

  contacts: ChatContactUI[];
  selectedContactId: string | null;
  onSelectContact: (id: string) => void;

  leftEmptyState: ReactNode;
  rightEmptyState: ReactNode;
  rightPanel: ReactNode;
};

export function ChatPageShell({
  pageTitle,
  pageSubtitle,
  searchPlaceholder,
  searchQuery,
  onSearchQueryChange,
  contacts,
  selectedContactId,
  onSelectContact,
  leftEmptyState,
  rightEmptyState,
  rightPanel,
}: Props) {
  const hasSelected = Boolean(selectedContactId);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
        {pageSubtitle ? <p className="text-muted-foreground">{pageSubtitle}</p> : null}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 h-[680px]">
        {/* Contacts */}
        <Card className="lg:col-span-4 xl:col-span-3 flex flex-col overflow-hidden">
          <CardHeader className="border-b py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            <ScrollArea className="h-full">
              {contacts.length === 0 ? (
                <div className="p-6">{leftEmptyState}</div>
              ) : (
                <div className="divide-y">
                  {contacts.map((c) => {
                    const active = selectedContactId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => onSelectContact(c.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 transition-colors hover:bg-muted/50",
                          active && "bg-muted"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 grid place-items-center text-sm font-semibold text-primary">
                            {(c.title?.[0] ?? "?").toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground truncate">{c.title}</p>
                              {(c.unreadCount ?? 0) > 0 ? (
                                <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                                  {c.unreadCount}
                                </span>
                              ) : null}
                            </div>
                            {c.subtitle ? (
                              <p className="text-xs text-muted-foreground truncate">{c.subtitle}</p>
                            ) : null}
                            {c.lastPreview ? (
                              <p className="mt-1 text-xs text-muted-foreground/80 truncate">{c.lastPreview}</p>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Thread */}
        <Card className="lg:col-span-8 xl:col-span-9 flex flex-col overflow-hidden">
          {!hasSelected ? (
            <CardContent className="flex-1 flex items-center justify-center">{rightEmptyState}</CardContent>
          ) : (
            rightPanel
          )}
        </Card>
      </div>
    </div>
  );
}
