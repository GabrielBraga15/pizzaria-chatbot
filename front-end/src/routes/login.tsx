import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bot, LogIn } from "lucide-react";
import { signIn, markSignedIn } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — LG IA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const ok = signIn(email.trim(), senha);
    setLoading(false);
    if (!ok) {
      toast.error("Email ou senha incorretos.");
      return;
    }
    markSignedIn();
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/painel" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-hero px-6 py-16 text-foreground">
      <Card className="w-full max-w-md border-border/60 bg-card/80 p-8 shadow-card">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-brand shadow-glow">
            <Bot className="h-5 w-5 text-brand-foreground" />
          </div>
          <span className="text-lg font-semibold tracking-tight">LG IA</span>
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Entrar no painel</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesse sua assinatura e gerencie o atendimento.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          <div className="grid gap-1.5">
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@seunegocio.com"
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-1.5">
            <Label>Senha</Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-2 bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90"
          >
            <LogIn className="mr-2 h-4 w-4" />
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Ainda não é cliente?{" "}
          <Link to="/cadastro" className="font-medium text-primary hover:underline">
            Assinar agora
          </Link>
        </p>
      </Card>
    </div>
  );
}
