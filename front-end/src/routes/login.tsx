import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Bot, LogIn, Loader2 } from "lucide-react";
import { loginFn } from "@/lib/login";

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

    try {
      const res = await loginFn({ data: { email, senha } });

      if (!res.success || !res.empresa) {
        toast.error(res.message || "Email ou senha incorretos.");
        setLoading(false);
        return;
      }

      // 1. Salva a sessão compatível com a rota /painel
      // Se a sua API gerar JWT use ele; caso contrário, usamos o ID/token retornado
      const token = (res as any).token || String(res.empresa.id);
      localStorage.setItem("auth_token", token);
      localStorage.setItem("empresa_id", String(res.empresa.id));
      localStorage.setItem("empresa_user", JSON.stringify(res.empresa));

      toast.success(`Bem-vindo de volta, ${res.empresa.nome_empresa}!`);

      // 2. Aguarda a navegação do TanStack Router
      await navigate({ to: "/painel" });
    } catch (error) {
      console.error("Erro ao realizar login:", error);
      toast.error("Erro ao conectar com o banco de dados.");
    } finally {
      setLoading(false);
    }
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@seunegocio.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
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
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Entrando...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" /> Entrar
              </>
            )}
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