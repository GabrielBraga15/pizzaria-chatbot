import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, CheckCircle2, Mail } from "lucide-react";

export const Route = createFileRoute("/obrigado")({
  head: () => ({
    meta: [
      { title: "Obrigado! — LG IA" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Obrigado,
});

function Obrigado() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-gradient-hero px-6 py-16 text-foreground">
      <Card className="w-full max-w-lg border-border/60 bg-card/80 p-10 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-brand shadow-glow">
          <CheckCircle2 className="h-8 w-8 text-brand-foreground" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Assinatura confirmada!</h1>
        <p className="mt-3 text-muted-foreground">
          Seu acesso ao <strong className="text-foreground">LG IA</strong> foi liberado.
          Enviamos as instruções de login para o seu email.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3 rounded-lg border border-border/60 bg-secondary/40 p-4 text-sm">
          <Mail className="h-5 w-5 text-primary" />
          <span>Confira sua caixa de entrada (e o spam, só por garantia).</span>
        </div>

        <Button asChild size="lg" className="mt-8 w-full bg-gradient-brand text-brand-foreground shadow-glow hover:opacity-90">
          <Link to="/">
            <Bot className="mr-2 h-4 w-4" /> Voltar ao site
          </Link>
        </Button>
      </Card>
    </div>
  );
}
