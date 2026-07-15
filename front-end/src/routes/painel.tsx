import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Bot,
  LogOut,
  MessageCircle,
  Phone,
  KeyRound,
  Calendar,
  Wallet,
  RotateCcw,
  XCircle,
  LifeBuoy,
} from "lucide-react";
import {
  cancelSubscription,
  getSession,
  isSignedIn,
  reactivateSubscription,
  signOut,
  type AccountSession,
} from "@/lib/auth";

export const Route = createFileRoute("/painel")({
  head: () => ({
    meta: [
      { title: "Painel — LG IA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Painel,
});

const SUPPORT_WHATSAPP = "5511999999999"; // troque pelo número real
const SUPPORT_EMAIL = "suporte@lgia.app";

function Painel() {
  const navigate = useNavigate();
  const [session, setSession] = useState<AccountSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isSignedIn()) {
      navigate({ to: "/login" });
      return;
    }
    setSession(getSession());
    setReady(true);
  }, [navigate]);

  if (!ready || !session) return null;

  function refresh() {
    setSession(getSession());
  }

  function handleLogout() {
    signOut();
    navigate({ to: "/login" });
  }

  function handleCancel() {
    cancelSubscription();
    refresh();
    toast.success("Assinatura cancelada. Você pode reativar quando quiser.");
  }

  function handleReactivate() {
    reactivateSubscription();
    refresh();
    toast.success("Assinatura reativada! Bom voltar.");
  }

  function openSupport() {
    const msg = encodeURIComponent(
      `Olá! Sou cliente da LG IA (${session!.email}) e preciso de ajuda com minha assinatura.`,
    );
    window.open(`https://wa.me/${SUPPORT_WHATSAPP}?text=${msg}`, "_blank", "noopener");
  }

  const active = session.status === "active";
  const nextDate = new Date(session.nextBillingAt).toLocaleDateString("pt-BR");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
              <Bot className="h-5 w-5 text-brand-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight">LG IA</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Meu painel</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Gerencie sua assinatura e fale com o suporte.
            </p>
          </div>
          <Button
            onClick={openSupport}
            className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
          >
            <LifeBuoy className="mr-2 h-4 w-4" /> Acionar suporte
          </Button>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Assinatura */}
          <Card className="border-border/60 bg-card/70 p-6 lg:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">
                  Plano
                </div>
                <div className="mt-1 text-xl font-semibold">Plano Mensal LG IA</div>
                <div className="mt-1 text-sm text-muted-foreground">R$ 200,00 / mês</div>
              </div>
              {active ? (
                <Badge className="bg-primary/20 text-primary hover:bg-primary/20">
                  <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                  Ativa
                </Badge>
              ) : (
                <Badge variant="destructive">Cancelada</Badge>
              )}
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={Calendar}
                label={active ? "Próxima cobrança" : "Cancelada em"}
                value={
                  active
                    ? nextDate
                    : session.canceledAt
                      ? new Date(session.canceledAt).toLocaleDateString("pt-BR")
                      : "—"
                }
              />
              <InfoRow
                icon={Wallet}
                label="Cliente desde"
                value={new Date(session.createdAt).toLocaleDateString("pt-BR")}
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3 border-t border-border/60 pt-6">
              {active ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" /> Cancelar assinatura
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar sua assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Seu acesso continua até o fim do período pago ({nextDate}). Depois disso, o
                        atendimento por IA será pausado. Você pode reativar quando quiser.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Voltar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancel}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Sim, cancelar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  onClick={handleReactivate}
                  className="bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Reativar assinatura
                </Button>
              )}
              <Button variant="outline" onClick={openSupport}>
                <MessageCircle className="mr-2 h-4 w-4" /> Falar com suporte
              </Button>
            </div>
          </Card>

          {/* Suporte */}
          <Card className="border-border/60 bg-card/70 p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand shadow-glow">
              <LifeBuoy className="h-5 w-5 text-brand-foreground" />
            </div>
            <h2 className="mt-4 text-lg font-semibold">Precisa de ajuda?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Nosso time responde em minutos, de segunda a sábado.
            </p>
            <div className="mt-4 grid gap-2">
              <Button
                onClick={openSupport}
                className="w-full bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
              >
                <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
              </Button>
              <Button asChild variant="outline" className="w-full">
                <a href={`mailto:${SUPPORT_EMAIL}`}>Enviar email</a>
              </Button>
            </div>
          </Card>
        </div>

        {/* Conta */}
        <Card className="mt-6 border-border/60 bg-card/70 p-6">
          <h2 className="text-lg font-semibold">Dados da conta</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <InfoRow icon={KeyRound} label="Email" value={session.email} />
            <InfoRow icon={Phone} label="Seu telefone" value={session.telefone} />
            <InfoRow
              icon={MessageCircle}
              label="WhatsApp comercial"
              value={session.telefoneComercial}
            />
            <InfoRow icon={Wallet} label="Chave Pix" value={session.pix} />
          </dl>
        </Card>
      </main>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-secondary/30 p-3">
      <div className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-secondary">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="mt-0.5 truncate text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
